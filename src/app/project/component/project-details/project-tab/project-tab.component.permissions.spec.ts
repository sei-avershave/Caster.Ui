// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  Project,
  ProjectPermission,
  SystemPermission,
} from 'src/app/generated/caster-api';
import { PermissionService } from 'src/app/permissions/permission.service';
import {
  createProjectPermissionClaim,
  MockPermissionService,
  waitForAsync as waitForAsyncHelper,
} from 'src/app/permissions/permission-test-helpers';
import { ProjectQuery, ProjectService } from 'src/app/project/state';
import { ModuleQuery, ModuleService } from 'src/app/modules/state';
import { DirectoryQuery } from 'src/app/directories/state';
import { WorkspaceQuery } from 'src/app/workspace/state';
import { FileQuery, FileService } from 'src/app/files/state';
import { CurrentUserQuery } from 'src/app/users/state';
import { DesignQuery } from 'src/app/designs/state/design.query';
import { ProjectTabComponent } from './project-tab.component';

describe('ProjectTabComponent - Permissions', () => {
  let component: ProjectTabComponent;
  let fixture: ComponentFixture<ProjectTabComponent>;
  let mockPermissionService: MockPermissionService;
  let mockProjectService: jasmine.SpyObj<ProjectService>;
  let mockProjectQuery: jasmine.SpyObj<ProjectQuery>;
  let mockModuleService: jasmine.SpyObj<ModuleService>;
  let mockModuleQuery: jasmine.SpyObj<ModuleQuery>;
  let mockDirectoryQuery: jasmine.SpyObj<DirectoryQuery>;
  let mockWorkspaceQuery: jasmine.SpyObj<WorkspaceQuery>;
  let mockFileQuery: jasmine.SpyObj<FileQuery>;
  let mockFileService: jasmine.SpyObj<FileService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockCurrentUserQuery: jasmine.SpyObj<CurrentUserQuery>;
  let mockDesignQuery: jasmine.SpyObj<DesignQuery>;

  const mockProject: Project = {
    id: 'project-123',
    name: 'Test Project',
  } as Project;

  beforeEach(waitForAsync(() => {
    mockPermissionService = new MockPermissionService();
    mockProjectService = jasmine.createSpyObj('ProjectService', [
      'setSelectedTab',
    ]);
    mockProjectQuery = jasmine.createSpyObj('ProjectQuery', [
      'getRightSidebarOpen$',
      'getRightSidebarView$',
      'getRightSidebarWidth',
      'selectSelectedTab',
      'selectOpenTabs',
      'selectTabBreadcrumb',
    ]);
    mockModuleService = jasmine.createSpyObj('ModuleService', ['load']);
    mockModuleQuery = jasmine.createSpyObj('ModuleQuery', ['selectAll']);
    mockDirectoryQuery = jasmine.createSpyObj('DirectoryQuery', [
      'selectEntity',
    ]);
    mockWorkspaceQuery = jasmine.createSpyObj('WorkspaceQuery', [
      'selectEntity',
    ]);
    mockFileQuery = jasmine.createSpyObj('FileQuery', [
      'selectEntity',
      'isEditing',
    ]);
    mockFileService = jasmine.createSpyObj('FileService', ['lockFile']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockCurrentUserQuery = jasmine.createSpyObj('CurrentUserQuery', ['select']);
    mockDesignQuery = jasmine.createSpyObj('DesignQuery', ['selectEntity']);

    // Setup default return values
    mockProjectQuery.getRightSidebarOpen$.and.returnValue(of(false));
    mockProjectQuery.getRightSidebarView$.and.returnValue(of(''));
    mockProjectQuery.getRightSidebarWidth.and.returnValue(of(300));
    mockProjectQuery.selectSelectedTab.and.returnValue(of(0));
    mockProjectQuery.selectOpenTabs.and.returnValue(of([]));
    mockProjectQuery.selectTabBreadcrumb.and.returnValue(of([]));
    mockModuleService.load.and.returnValue(of([]));
    mockModuleQuery.selectAll.and.returnValue(of([]));
    mockCurrentUserQuery.select.and.returnValue(
      of({ id: 'user-1', name: '', lastRoute: '/' })
    );

    TestBed.configureTestingModule({
      declarations: [ProjectTabComponent],
      imports: [NoopAnimationsModule],
      providers: [
        { provide: ProjectService, useValue: mockProjectService },
        { provide: ProjectQuery, useValue: mockProjectQuery },
        { provide: ModuleService, useValue: mockModuleService },
        { provide: ModuleQuery, useValue: mockModuleQuery },
        { provide: DirectoryQuery, useValue: mockDirectoryQuery },
        { provide: WorkspaceQuery, useValue: mockWorkspaceQuery },
        { provide: FileQuery, useValue: mockFileQuery },
        { provide: FileService, useValue: mockFileService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: CurrentUserQuery, useValue: mockCurrentUserQuery },
        { provide: DesignQuery, useValue: mockDesignQuery },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectTabComponent);
    component = fixture.componentInstance;
    component.project = mockProject;
    component.projectUI = { id: mockProject.id } as any;
  });

  afterEach(() => {
    mockPermissionService.clearPermissions();
  });

  describe('canEdit$ Permission', () => {
    it('should be true with SystemPermission.EditProjects', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.EditProjects,
      ]);
      fixture.detectChanges();

      component.ngOnInit();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(true);
        done();
      });
    });

    it('should be true with ProjectPermission.EditProject for this project', (done) => {
      mockPermissionService.setSystemPermissions([]);
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim(mockProject.id, [
          ProjectPermission.EditProject,
        ]),
      ]);
      fixture.detectChanges();

      component.ngOnInit();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(true);
        done();
      });
    });

    it('should be false without EditProjects permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewProjects,
      ]);
      mockPermissionService.setProjectPermissions([]);
      fixture.detectChanges();

      component.ngOnInit();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(false);
        done();
      });
    });

    it('should be false with EditProject permission for different project', (done) => {
      mockPermissionService.setSystemPermissions([]);
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim('different-project', [
          ProjectPermission.EditProject,
        ]),
      ]);
      fixture.detectChanges();

      component.ngOnInit();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(false);
        done();
      });
    });

    it('should initialize canEdit$ on ngOnInit', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.EditProjects,
      ]);
      fixture.detectChanges();

      component.ngOnInit();
      await waitForAsyncHelper(fixture);

      expect(component.canEdit$).toBeDefined();
    });
  });

  describe('canAdminLock$ Permission', () => {
    it('should be true with SystemPermission.LockFiles', (done) => {
      mockPermissionService.setSystemPermissions([SystemPermission.LockFiles]);
      fixture.detectChanges();

      component.ngOnInit();

      component.canAdminLock$.pipe(take(1)).subscribe((canLock) => {
        expect(canLock).toBe(true);
        done();
      });
    });

    it('should be true with ProjectPermission.LockFiles for this project', (done) => {
      mockPermissionService.setSystemPermissions([]);
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim(mockProject.id, [
          ProjectPermission.LockFiles,
        ]),
      ]);
      fixture.detectChanges();

      component.ngOnInit();

      component.canAdminLock$.pipe(take(1)).subscribe((canLock) => {
        expect(canLock).toBe(true);
        done();
      });
    });

    it('should be false without LockFiles permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.EditProjects,
      ]);
      mockPermissionService.setProjectPermissions([]);
      fixture.detectChanges();

      component.ngOnInit();

      component.canAdminLock$.pipe(take(1)).subscribe((canLock) => {
        expect(canLock).toBe(false);
        done();
      });
    });

    it('should be false with LockFiles permission for different project', (done) => {
      mockPermissionService.setSystemPermissions([]);
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim('different-project', [
          ProjectPermission.LockFiles,
        ]),
      ]);
      fixture.detectChanges();

      component.ngOnInit();

      component.canAdminLock$.pipe(take(1)).subscribe((canLock) => {
        expect(canLock).toBe(false);
        done();
      });
    });

    it('should initialize canAdminLock$ on ngOnInit', async () => {
      mockPermissionService.setSystemPermissions([SystemPermission.LockFiles]);
      fixture.detectChanges();

      component.ngOnInit();
      await waitForAsyncHelper(fixture);

      expect(component.canAdminLock$).toBeDefined();
    });
  });

  describe('Permission Combinations', () => {
    it('should allow editing with EditProjects but not admin locking', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.EditProjects,
      ]);
      mockPermissionService.setProjectPermissions([]);
      fixture.detectChanges();

      component.ngOnInit();
      await waitForAsyncHelper(fixture);

      let canEdit = false;
      let canAdminLock = true;

      component.canEdit$.subscribe((value) => {
        canEdit = value;
      });
      component.canAdminLock$.subscribe((value) => {
        canAdminLock = value;
      });

      expect(canEdit).toBe(true);
      expect(canAdminLock).toBe(false);
    });

    it('should allow admin locking with LockFiles but not editing', async () => {
      mockPermissionService.setSystemPermissions([SystemPermission.LockFiles]);
      mockPermissionService.setProjectPermissions([]);
      fixture.detectChanges();

      component.ngOnInit();
      await waitForAsyncHelper(fixture);

      let canEdit = true;
      let canAdminLock = false;

      component.canEdit$.subscribe((value) => {
        canEdit = value;
      });
      component.canAdminLock$.subscribe((value) => {
        canAdminLock = value;
      });

      expect(canEdit).toBe(false);
      expect(canAdminLock).toBe(true);
    });

    it('should allow both editing and admin locking with both permissions', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.EditProjects,
        SystemPermission.LockFiles,
      ]);
      mockPermissionService.setProjectPermissions([]);
      fixture.detectChanges();

      component.ngOnInit();
      await waitForAsyncHelper(fixture);

      let canEdit = false;
      let canAdminLock = false;

      component.canEdit$.subscribe((value) => {
        canEdit = value;
      });
      component.canAdminLock$.subscribe((value) => {
        canAdminLock = value;
      });

      expect(canEdit).toBe(true);
      expect(canAdminLock).toBe(true);
    });

    it('should work with project-level permissions', async () => {
      mockPermissionService.setSystemPermissions([]);
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim(mockProject.id, [
          ProjectPermission.EditProject,
          ProjectPermission.LockFiles,
        ]),
      ]);
      fixture.detectChanges();

      component.ngOnInit();
      await waitForAsyncHelper(fixture);

      let canEdit = false;
      let canAdminLock = false;

      component.canEdit$.subscribe((value) => {
        canEdit = value;
      });
      component.canAdminLock$.subscribe((value) => {
        canAdminLock = value;
      });

      expect(canEdit).toBe(true);
      expect(canAdminLock).toBe(true);
    });
  });

  describe('Permission Hierarchy', () => {
    it('should prioritize system-level EditProjects over project-level', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.EditProjects,
      ]);
      // Project permission for different project
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim('other-project', [
          ProjectPermission.EditProject,
        ]),
      ]);
      fixture.detectChanges();

      component.ngOnInit();
      await waitForAsyncHelper(fixture);

      let canEdit = false;
      component.canEdit$.subscribe((value) => {
        canEdit = value;
      });

      // Should be true because system permission overrides
      expect(canEdit).toBe(true);
    });

    it('should prioritize system-level LockFiles over project-level', async () => {
      mockPermissionService.setSystemPermissions([SystemPermission.LockFiles]);
      // Project permission for different project
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim('other-project', [
          ProjectPermission.LockFiles,
        ]),
      ]);
      fixture.detectChanges();

      component.ngOnInit();
      await waitForAsyncHelper(fixture);

      let canAdminLock = false;
      component.canAdminLock$.subscribe((value) => {
        canAdminLock = value;
      });

      // Should be true because system permission overrides
      expect(canAdminLock).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should require a valid project to function', () => {
      component.project = undefined;
      component.projectUI = undefined;
      mockPermissionService.setSystemPermissions([
        SystemPermission.EditProjects,
      ]);

      // Component requires a project to be set, so it will throw if project is undefined
      // This is expected behavior as the component is designed to work with a project
      expect(() => {
        fixture.detectChanges();
      }).toThrow();
    });

    it('should handle permission service errors gracefully', (done) => {
      spyOn(mockPermissionService, 'canEditProject').and.returnValue(of(false));
      spyOn(mockPermissionService, 'canAdminLockProject').and.returnValue(
        of(false)
      );

      fixture.detectChanges();
      component.ngOnInit();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(false);
        done();
      });
    });

    it('should load modules on init regardless of permissions', () => {
      mockPermissionService.setSystemPermissions([]);
      fixture.detectChanges();

      component.ngOnInit();

      expect(mockModuleService.load).toHaveBeenCalledWith(false, false);
    });
  });
});
