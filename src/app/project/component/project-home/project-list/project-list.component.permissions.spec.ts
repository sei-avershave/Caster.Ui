// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
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
import { ProjectService } from 'src/app/project/state';
import { ConfirmDialogService } from 'src/app/sei-cwd-common/confirm-dialog/service/confirm-dialog.service';
import { ProjectListComponent } from './project-list.component';

describe('ProjectListComponent - Permissions', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let mockPermissionService: MockPermissionService;
  let mockProjectService: jasmine.SpyObj<ProjectService>;
  let mockDialogService: jasmine.SpyObj<ConfirmDialogService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockProjects: Project[] = [
    { id: 'project-1', name: 'Project 1' } as Project,
    { id: 'project-2', name: 'Project 2' } as Project,
    { id: 'project-3', name: 'Project 3' } as Project,
  ];

  beforeEach(waitForAsync(() => {
    mockPermissionService = new MockPermissionService();
    mockProjectService = jasmine.createSpyObj('ProjectService', [
      'createProject',
      'updateProject',
      'deleteProject',
    ]);
    mockDialogService = jasmine.createSpyObj('ConfirmDialogService', [
      'confirmDialog',
    ]);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    // Setup default return values
    mockProjectService.createProject.and.returnValue(of({} as Project));
    mockProjectService.updateProject.and.returnValue(of({} as Project));
    mockProjectService.deleteProject.and.returnValue(of(null));
    mockDialogService.confirmDialog.and.returnValue(
      of({ wasCancelled: false })
    );

    TestBed.configureTestingModule({
      declarations: [ProjectListComponent],
      imports: [MatTableModule, NoopAnimationsModule],
      providers: [
        { provide: ProjectService, useValue: mockProjectService },
        { provide: ConfirmDialogService, useValue: mockDialogService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: PermissionService, useValue: mockPermissionService },
        MatSort,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    component.projects = mockProjects;

    // Setup default dialog behavior
    const defaultDialogRef = {
      componentInstance: {
        title: '',
        message: '',
      },
      afterClosed: () => of({ wasCancelled: false, nameValue: 'Test Name' }),
    };
    mockDialog.open.and.returnValue(defaultDialogRef as any);
  });

  afterEach(() => {
    mockPermissionService.clearPermissions();
  });

  describe('CreateProjects Permission', () => {
    it('should expose canCreate$ observable as true when user has CreateProjects permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.CreateProjects,
      ]);
      fixture.detectChanges();

      component.canCreate$.pipe(take(1)).subscribe((canCreate) => {
        expect(canCreate).toBe(true);
        done();
      });
    });

    it('should expose canCreate$ observable as false when user lacks CreateProjects permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewProjects,
      ]);
      fixture.detectChanges();

      component.canCreate$.pipe(take(1)).subscribe((canCreate) => {
        expect(canCreate).toBe(false);
        done();
      });
    });

    it('should expose canCreate$ observable as false when user has no permissions', (done) => {
      mockPermissionService.setSystemPermissions([]);
      fixture.detectChanges();

      component.canCreate$.pipe(take(1)).subscribe((canCreate) => {
        expect(canCreate).toBe(false);
        done();
      });
    });
  });

  describe('ManageProjects System Permission', () => {
    it('should expose canManageAll$ as true when user has ManageProjects system permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageProjects,
      ]);
      fixture.detectChanges();

      component.canManageAll$.pipe(take(1)).subscribe((canManage) => {
        expect(canManage).toBe(true);
        done();
      });
    });

    it('should expose canManageAll$ as false when user lacks ManageProjects system permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewProjects,
      ]);
      fixture.detectChanges();

      component.canManageAll$.pipe(take(1)).subscribe((canManage) => {
        expect(canManage).toBe(false);
        done();
      });
    });

    it('should allow managing all projects with ManageProjects system permission', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageProjects,
      ]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      component.canManageAll$.pipe(take(1)).subscribe((canManage) => {
        expect(canManage).toBe(true);
      });
    });
  });

  describe('ManageProject Project Permission', () => {
    it('should expose canManageProjects$ with project IDs user can manage', (done) => {
      const project1Id = 'project-1';
      const project2Id = 'project-2';

      mockPermissionService.setSystemPermissions([]);
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim(project1Id, [
          ProjectPermission.ManageProject,
        ]),
        createProjectPermissionClaim(project2Id, [
          ProjectPermission.ManageProject,
        ]),
      ]);
      fixture.detectChanges();

      component.canManageProjects$.pipe(take(1)).subscribe((projectIds) => {
        expect(projectIds).toContain(project1Id);
        expect(projectIds).toContain(project2Id);
        expect(projectIds).not.toContain('project-3');
        done();
      });
    });

    it('should expose empty canManageProjects$ when user has no project-level manage permissions', (done) => {
      mockPermissionService.setSystemPermissions([]);
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim('project-1', [
          ProjectPermission.ViewProject,
        ]),
      ]);
      fixture.detectChanges();

      component.canManageProjects$.pipe(take(1)).subscribe((projectIds) => {
        const manageable = projectIds.filter((id) => id !== null);
        expect(manageable.length).toBe(0);
        done();
      });
    });

    it('should allow managing specific project with ProjectPermission.ManageProject', (done) => {
      const projectId = 'project-1';

      mockPermissionService.setSystemPermissions([]);
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim(projectId, [
          ProjectPermission.ManageProject,
        ]),
      ]);
      fixture.detectChanges();

      component.canManageProjects$.pipe(take(1)).subscribe((projectIds) => {
        expect(projectIds).toContain(projectId);
        done();
      });
    });

    it('should not allow managing project without ManageProject permission', (done) => {
      const projectId = 'project-1';

      mockPermissionService.setSystemPermissions([]);
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim(projectId, [
          ProjectPermission.EditProject,
        ]),
      ]);
      fixture.detectChanges();

      component.canManageProjects$.pipe(take(1)).subscribe((projectIds) => {
        const manageable = projectIds.filter((id) => id === projectId);
        expect(manageable.length).toBe(0);
        done();
      });
    });
  });

  describe('Permission Hierarchy', () => {
    it('should allow system-level ManageProjects to override lack of project-level permissions', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageProjects,
      ]);
      mockPermissionService.setProjectPermissions([]);
      fixture.detectChanges();

      component.canManageAll$.pipe(take(1)).subscribe((canManage) => {
        expect(canManage).toBe(true);
        done();
      });
    });

    it('should combine system and project-level permissions', async () => {
      // User has system-level ManageProjects
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageProjects,
      ]);
      // And also specific project-level permission (redundant but valid)
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim('project-1', [
          ProjectPermission.ManageProject,
        ]),
      ]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      let canManageAll = false;
      component.canManageAll$.subscribe((value) => {
        canManageAll = value;
      });

      expect(canManageAll).toBe(true);
    });
  });

  describe('Component Operations with Permissions', () => {
    it('should call createProject when user has CreateProjects permission', () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.CreateProjects,
      ]);
      fixture.detectChanges();

      component.create();

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should load project permissions on init', () => {
      spyOn(mockPermissionService, 'loadProjectPermissions').and.returnValue(
        of([])
      );

      component.ngOnInit();

      expect(mockPermissionService.loadProjectPermissions).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty project list', async () => {
      component.projects = [];
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageProjects,
      ]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      expect(component.dataSource.data.length).toBe(0);
    });

    it('should handle null permissions gracefully', (done) => {
      mockPermissionService.setSystemPermissions([]);
      mockPermissionService.setProjectPermissions([]);
      fixture.detectChanges();

      component.canCreate$.pipe(take(1)).subscribe((canCreate) => {
        expect(canCreate).toBe(false);
        done();
      });
    });

    it('should handle multiple projects with mixed permissions', (done) => {
      mockPermissionService.setSystemPermissions([]);
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim('project-1', [
          ProjectPermission.ManageProject,
        ]),
        createProjectPermissionClaim('project-2', [
          ProjectPermission.ViewProject,
        ]),
        createProjectPermissionClaim('project-3', [
          ProjectPermission.ManageProject,
        ]),
      ]);
      fixture.detectChanges();

      component.canManageProjects$.pipe(take(1)).subscribe((projectIds) => {
        const manageableProjects = projectIds.filter((id) => id !== null);
        expect(manageableProjects.length).toBe(2);
        expect(manageableProjects).toContain('project-1');
        expect(manageableProjects).toContain('project-3');
        expect(manageableProjects).not.toContain('project-2');
        done();
      });
    });
  });
});
