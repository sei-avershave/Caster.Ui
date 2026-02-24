// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import {
  ComnAuthQuery,
  ComnAuthService,
  ComnSettingsService,
} from '@cmusei/crucible-common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatMenuModule } from '@angular/material/menu';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { SystemPermission } from 'src/app/generated/caster-api';
import { PermissionService } from 'src/app/permissions/permission.service';
import {
  createProjectPermissionClaim,
  MockPermissionService,
  waitForAsync as waitForAsyncHelper,
} from 'src/app/permissions/permission-test-helpers';
import { ProjectPermission } from 'src/app/generated/caster-api';
import { CurrentUserQuery, UserService } from 'src/app/users/state';
import { TopbarComponent } from './topbar.component';
import { ProjectQuery } from 'src/app/project';

describe('TopbarComponent - Permissions', () => {
  let component: TopbarComponent;
  let fixture: ComponentFixture<TopbarComponent>;
  let mockPermissionService: MockPermissionService;
  let mockAuthService: jasmine.SpyObj<ComnAuthService>;
  let mockCurrentUserQuery: jasmine.SpyObj<CurrentUserQuery>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockAuthQuery: jasmine.SpyObj<ComnAuthQuery>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSettingsService: jasmine.SpyObj<ComnSettingsService>;
  let mockProjectQuery: jasmine.SpyObj<ProjectQuery>;

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
  };

  beforeEach(waitForAsync(() => {
    mockPermissionService = new MockPermissionService();
    mockAuthService = jasmine.createSpyObj('ComnAuthService', [
      'logout',
      'setUserTheme',
    ]);
    mockCurrentUserQuery = jasmine.createSpyObj('CurrentUserQuery', [
      'select',
      'getLastRoute',
    ]);
    mockUserService = jasmine.createSpyObj('UserService', ['setUserTheme']);
    mockAuthQuery = jasmine.createSpyObj('ComnAuthQuery', [], {
      userTheme$: of('light-theme'),
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockSettingsService = jasmine.createSpyObj('ComnSettingsService', [], {
      settings: {
        AppTopBarHexColor: '#E9831C',
        AppTopBarHexTextColor: '#FFFFFF',
      },
    });
    mockProjectQuery = jasmine.createSpyObj('ProjectQuery', ['selectActive']);

    mockCurrentUserQuery.select.and.returnValue(
      of({ ...mockUser, lastRoute: '/' })
    );
    mockCurrentUserQuery.getLastRoute.and.returnValue('/');
    mockProjectQuery.selectActive.and.returnValue(of(null));

    TestBed.configureTestingModule({
      declarations: [TopbarComponent],
      imports: [NoopAnimationsModule, MatMenuModule],
      providers: [
        { provide: ComnAuthService, useValue: mockAuthService },
        { provide: CurrentUserQuery, useValue: mockCurrentUserQuery },
        { provide: UserService, useValue: mockUserService },
        { provide: ComnAuthQuery, useValue: mockAuthQuery },
        { provide: Router, useValue: mockRouter },
        { provide: ComnSettingsService, useValue: mockSettingsService },
        { provide: PermissionService, useValue: mockPermissionService },
        { provide: ProjectQuery, useValue: mockProjectQuery },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopbarComponent);
    component = fixture.componentInstance;
    spyOn(mockPermissionService, 'load').and.returnValue(of([]));
  });

  afterEach(() => {
    mockPermissionService.clearPermissions();
  });

  describe('canViewAdmin$ (Administration Menu Visibility)', () => {
    it('should be true when user has any View* permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewProjects,
      ]);
      fixture.detectChanges();

      component.canViewAdmin$.pipe(take(1)).subscribe((canView) => {
        expect(canView).toBe(true);
        done();
      });
    });

    it('should be true when user has ViewUsers permission', (done) => {
      mockPermissionService.setSystemPermissions([SystemPermission.ViewUsers]);
      fixture.detectChanges();

      component.canViewAdmin$.pipe(take(1)).subscribe((canView) => {
        expect(canView).toBe(true);
        done();
      });
    });

    it('should be true when user has ViewWorkspaces permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewWorkspaces,
      ]);
      fixture.detectChanges();

      component.canViewAdmin$.pipe(take(1)).subscribe((canView) => {
        expect(canView).toBe(true);
        done();
      });
    });

    it('should be true when user has ViewVLANs permission', (done) => {
      mockPermissionService.setSystemPermissions([SystemPermission.ViewVlans]);
      fixture.detectChanges();

      component.canViewAdmin$.pipe(take(1)).subscribe((canView) => {
        expect(canView).toBe(true);
        done();
      });
    });

    it('should be true when user has ViewRoles permission', (done) => {
      mockPermissionService.setSystemPermissions([SystemPermission.ViewRoles]);
      fixture.detectChanges();

      component.canViewAdmin$.pipe(take(1)).subscribe((canView) => {
        expect(canView).toBe(true);
        done();
      });
    });

    it('should be true when user has ViewGroups permission', (done) => {
      mockPermissionService.setSystemPermissions([SystemPermission.ViewGroups]);
      fixture.detectChanges();

      component.canViewAdmin$.pipe(take(1)).subscribe((canView) => {
        expect(canView).toBe(true);
        done();
      });
    });

    it('should be true when user has ViewModules permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewModules,
      ]);
      fixture.detectChanges();

      component.canViewAdmin$.pipe(take(1)).subscribe((canView) => {
        expect(canView).toBe(true);
        done();
      });
    });

    it('should be true when user has multiple View* permissions', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewProjects,
        SystemPermission.ViewUsers,
        SystemPermission.ViewRoles,
      ]);
      fixture.detectChanges();

      component.canViewAdmin$.pipe(take(1)).subscribe((canView) => {
        expect(canView).toBe(true);
        done();
      });
    });

    it('should be false when user has no View* permissions', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.CreateProjects,
        SystemPermission.ManageUsers,
      ]);
      fixture.detectChanges();

      component.canViewAdmin$.pipe(take(1)).subscribe((canView) => {
        expect(canView).toBe(false);
        done();
      });
    });

    it('should be false when user has no permissions at all', (done) => {
      mockPermissionService.setSystemPermissions([]);
      fixture.detectChanges();

      component.canViewAdmin$.pipe(take(1)).subscribe((canView) => {
        expect(canView).toBe(false);
        done();
      });
    });
  });

  describe('canManageProject$ (Project Management)', () => {
    const projectId = 'project-123';

    beforeEach(() => {
      component.projectId = projectId;
    });

    it('should be true when user has ManageProjects system permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageProjects,
      ]);
      component.ngOnChanges();

      component.canManageProject$.pipe(take(1)).subscribe((canManage) => {
        expect(canManage).toBe(true);
        done();
      });
    });

    it('should be true when user has ManageProject permission for specific project', (done) => {
      mockPermissionService.setSystemPermissions([]);
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim(projectId, [
          ProjectPermission.ManageProject,
        ]),
      ]);
      component.ngOnChanges();

      component.canManageProject$.pipe(take(1)).subscribe((canManage) => {
        expect(canManage).toBe(true);
        done();
      });
    });

    it('should be false when user lacks ManageProject permissions', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewProjects,
      ]);
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim(projectId, [
          ProjectPermission.EditProject,
        ]),
      ]);
      component.ngOnChanges();

      component.canManageProject$.pipe(take(1)).subscribe((canManage) => {
        expect(canManage).toBe(false);
        done();
      });
    });

    it('should be false when user has ManageProject for different project', (done) => {
      mockPermissionService.setSystemPermissions([]);
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim('different-project', [
          ProjectPermission.ManageProject,
        ]),
      ]);
      component.ngOnChanges();

      component.canManageProject$.pipe(take(1)).subscribe((canManage) => {
        expect(canManage).toBe(false);
        done();
      });
    });

    it('should update when projectId changes', async () => {
      const project1 = 'project-1';
      const project2 = 'project-2';

      mockPermissionService.setSystemPermissions([]);
      mockPermissionService.setProjectPermissions([
        createProjectPermissionClaim(project1, [
          ProjectPermission.ManageProject,
        ]),
      ]);

      // First project
      component.projectId = project1;
      component.ngOnChanges();
      await waitForAsyncHelper(fixture);

      let canManage1 = false;
      component.canManageProject$.subscribe((value) => {
        canManage1 = value;
      });
      expect(canManage1).toBe(true);

      // Change to second project (no permission)
      component.projectId = project2;
      component.ngOnChanges();
      await waitForAsyncHelper(fixture);

      let canManage2 = true;
      component.canManageProject$.subscribe((value) => {
        canManage2 = value;
      });
      expect(canManage2).toBe(false);
    });
  });

  describe('Permission Loading', () => {
    it('should load permissions on init', () => {
      component.ngOnInit();

      expect(mockPermissionService.load).toHaveBeenCalled();
    });

    it('should handle permission loading errors gracefully', () => {
      (mockPermissionService.load as jasmine.Spy).and.throwError(
        'Permission load error'
      );

      expect(() => {
        component.ngOnInit();
      }).toThrow();
    });
  });

  describe('Permission Combinations', () => {
    it('should handle user with both View and Manage permissions', async () => {
      const projectId = 'project-123';
      component.projectId = projectId;

      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewProjects,
        SystemPermission.ManageProjects,
      ]);
      mockPermissionService.setProjectPermissions([]);
      fixture.detectChanges();
      component.ngOnChanges();
      await waitForAsyncHelper(fixture);

      let canViewAdmin = false;
      component.canViewAdmin$.subscribe((value) => {
        canViewAdmin = value;
      });
      expect(canViewAdmin).toBe(true);

      let canManageProject = false;
      component.canManageProject$.subscribe((value) => {
        canManageProject = value;
      });
      expect(canManageProject).toBe(true);
    });

    it('should handle user with View but not Manage permissions', async () => {
      const projectId = 'project-123';
      component.projectId = projectId;

      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewProjects,
      ]);
      mockPermissionService.setProjectPermissions([]);
      fixture.detectChanges();
      component.ngOnChanges();
      await waitForAsyncHelper(fixture);

      let canViewAdmin = false;
      component.canViewAdmin$.subscribe((value) => {
        canViewAdmin = value;
      });
      expect(canViewAdmin).toBe(true);

      let canManageProject = true;
      component.canManageProject$.subscribe((value) => {
        canManageProject = value;
      });
      expect(canManageProject).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined projectId', () => {
      component.projectId = undefined;
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageProjects,
      ]);

      expect(() => {
        component.ngOnChanges();
      }).not.toThrow();
    });

    it('should handle null projectId', () => {
      component.projectId = null;
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageProjects,
      ]);

      expect(() => {
        component.ngOnChanges();
      }).not.toThrow();
    });
  });
});
