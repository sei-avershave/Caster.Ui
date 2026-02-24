// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  ProjectPermission,
  ProjectPermissionsClaim,
  ProjectPermissionsService,
  SystemPermission,
  SystemPermissionsService,
} from '../generated/caster-api';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  let service: PermissionService;
  let systemPermissionsService: jasmine.SpyObj<SystemPermissionsService>;
  let projectPermissionsService: jasmine.SpyObj<ProjectPermissionsService>;

  beforeEach(() => {
    const systemPermissionsSpy = jasmine.createSpyObj(
      'SystemPermissionsService',
      ['getMySystemPermissions']
    );
    const projectPermissionsSpy = jasmine.createSpyObj(
      'ProjectPermissionsService',
      ['getMyProjectPermissions']
    );

    TestBed.configureTestingModule({
      providers: [
        PermissionService,
        { provide: SystemPermissionsService, useValue: systemPermissionsSpy },
        {
          provide: ProjectPermissionsService,
          useValue: projectPermissionsSpy,
        },
      ],
    });

    service = TestBed.inject(PermissionService);
    systemPermissionsService = TestBed.inject(
      SystemPermissionsService
    ) as jasmine.SpyObj<SystemPermissionsService>;
    projectPermissionsService = TestBed.inject(
      ProjectPermissionsService
    ) as jasmine.SpyObj<ProjectPermissionsService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('load', () => {
    it('should load system permissions', (done) => {
      const mockPermissions = [
        SystemPermission.ViewProjects,
        SystemPermission.CreateProjects,
      ];
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of(mockPermissions));

      service
        .load()
        .pipe(take(1))
        .subscribe((permissions) => {
          expect(permissions).toEqual(mockPermissions);
          expect(
            systemPermissionsService.getMySystemPermissions
          ).toHaveBeenCalled();
          done();
        });
    });

    it('should update permissions$ observable', (done) => {
      const mockPermissions = [SystemPermission.ViewProjects];
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of(mockPermissions));

      service.load().subscribe();

      service.permissions$.pipe(take(1)).subscribe((permissions) => {
        expect(permissions).toEqual(mockPermissions);
        done();
      });
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has the system permission', (done) => {
      const mockPermissions = [
        SystemPermission.ViewProjects,
        SystemPermission.CreateProjects,
      ];
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of(mockPermissions));
      service.load().subscribe();

      service
        .hasPermission(SystemPermission.ViewProjects)
        .pipe(take(1))
        .subscribe((has) => {
          expect(has).toBe(true);
          done();
        });
    });

    it('should return false when user lacks the system permission', (done) => {
      const mockPermissions = [SystemPermission.ViewProjects];
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of(mockPermissions));
      service.load().subscribe();

      service
        .hasPermission(SystemPermission.ManageProjects)
        .pipe(take(1))
        .subscribe((has) => {
          expect(has).toBe(false);
          done();
        });
    });

    it('should return false when user has no permissions', (done) => {
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of([]));
      service.load().subscribe();

      service
        .hasPermission(SystemPermission.ViewProjects)
        .pipe(take(1))
        .subscribe((has) => {
          expect(has).toBe(false);
          done();
        });
    });
  });

  describe('canViewAdiminstration', () => {
    it('should return true when user has any View* permission', (done) => {
      const mockPermissions = [
        SystemPermission.ViewProjects,
        SystemPermission.CreateProjects,
      ];
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of(mockPermissions));
      service.load().subscribe();

      service
        .canViewAdiminstration()
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(true);
          done();
        });
    });

    it('should return true when user has multiple View* permissions', (done) => {
      const mockPermissions = [
        SystemPermission.ViewProjects,
        SystemPermission.ViewUsers,
        SystemPermission.ViewRoles,
      ];
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of(mockPermissions));
      service.load().subscribe();

      service
        .canViewAdiminstration()
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(true);
          done();
        });
    });

    it('should return false when user has no View* permissions', (done) => {
      const mockPermissions = [
        SystemPermission.CreateProjects,
        SystemPermission.ManageUsers,
      ];
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of(mockPermissions));
      service.load().subscribe();

      service
        .canViewAdiminstration()
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(false);
          done();
        });
    });

    it('should return false when user has no permissions at all', (done) => {
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of([]));
      service.load().subscribe();

      service
        .canViewAdiminstration()
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(false);
          done();
        });
    });
  });

  describe('loadProjectPermissions', () => {
    it('should load project permissions for specific project', (done) => {
      const projectId = 'project-123';
      const mockClaims: ProjectPermissionsClaim[] = [
        {
          projectId: projectId,
          permissions: [ProjectPermission.EditProject],
        },
      ];
      (
        projectPermissionsService.getMyProjectPermissions as jasmine.Spy
      ).and.returnValue(of(mockClaims));

      service
        .loadProjectPermissions(projectId)
        .pipe(take(1))
        .subscribe((claims) => {
          expect(claims).toEqual(mockClaims);
          expect(
            projectPermissionsService.getMyProjectPermissions
          ).toHaveBeenCalledWith(projectId);
          done();
        });
    });

    it('should load all project permissions when no projectId provided', (done) => {
      const mockClaims: ProjectPermissionsClaim[] = [
        {
          projectId: 'project-1',
          permissions: [ProjectPermission.EditProject],
        },
        {
          projectId: 'project-2',
          permissions: [ProjectPermission.ManageProject],
        },
      ];
      (
        projectPermissionsService.getMyProjectPermissions as jasmine.Spy
      ).and.returnValue(of(mockClaims));

      service
        .loadProjectPermissions()
        .pipe(take(1))
        .subscribe((claims) => {
          expect(claims).toEqual(mockClaims);
          expect(
            projectPermissionsService.getMyProjectPermissions
          ).toHaveBeenCalledWith(undefined);
          done();
        });
    });

    it('should update projectPermissions$ observable', (done) => {
      const mockClaims: ProjectPermissionsClaim[] = [
        {
          projectId: 'project-123',
          permissions: [ProjectPermission.EditProject],
        },
      ];
      (
        projectPermissionsService.getMyProjectPermissions as jasmine.Spy
      ).and.returnValue(of(mockClaims));

      service.loadProjectPermissions().subscribe();

      service.projectPermissions$.pipe(take(1)).subscribe((claims) => {
        expect(claims).toEqual(mockClaims);
        done();
      });
    });
  });

  describe('canEditProject', () => {
    const projectId = 'project-123';

    beforeEach(() => {
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of([]));
      (
        projectPermissionsService.getMyProjectPermissions as jasmine.Spy
      ).and.returnValue(of([]));
      service.load().subscribe();
      service.loadProjectPermissions().subscribe();
    });

    it('should return true with SystemPermission.EditProjects', (done) => {
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of([SystemPermission.EditProjects]));
      service.load().subscribe();

      service
        .canEditProject(projectId)
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(true);
          done();
        });
    });

    it('should return true with ProjectPermission.EditProject for specific project', (done) => {
      const mockClaims: ProjectPermissionsClaim[] = [
        {
          projectId: projectId,
          permissions: [ProjectPermission.EditProject],
        },
      ];
      (
        projectPermissionsService.getMyProjectPermissions as jasmine.Spy
      ).and.returnValue(of(mockClaims));
      service.loadProjectPermissions().subscribe();

      service
        .canEditProject(projectId)
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(true);
          done();
        });
    });

    it('should return false without EditProjects system permission or EditProject project permission', (done) => {
      service
        .canEditProject(projectId)
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(false);
          done();
        });
    });

    it('should return false with project permission for different project', (done) => {
      const mockClaims: ProjectPermissionsClaim[] = [
        {
          projectId: 'different-project',
          permissions: [ProjectPermission.EditProject],
        },
      ];
      (
        projectPermissionsService.getMyProjectPermissions as jasmine.Spy
      ).and.returnValue(of(mockClaims));
      service.loadProjectPermissions().subscribe();

      service
        .canEditProject(projectId)
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(false);
          done();
        });
    });

    it('should prioritize system permission over project permission', (done) => {
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of([SystemPermission.EditProjects]));
      service.load().subscribe();

      const mockClaims: ProjectPermissionsClaim[] = [
        {
          projectId: 'other-project',
          permissions: [ProjectPermission.EditProject],
        },
      ];
      (
        projectPermissionsService.getMyProjectPermissions as jasmine.Spy
      ).and.returnValue(of(mockClaims));
      service.loadProjectPermissions().subscribe();

      // Should return true even though project permission is for different project
      // because system permission applies to all projects
      service
        .canEditProject(projectId)
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(true);
          done();
        });
    });
  });

  describe('canManageProject', () => {
    const projectId = 'project-123';

    beforeEach(() => {
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of([]));
      (
        projectPermissionsService.getMyProjectPermissions as jasmine.Spy
      ).and.returnValue(of([]));
      service.load().subscribe();
      service.loadProjectPermissions().subscribe();
    });

    it('should return true with SystemPermission.ManageProjects', (done) => {
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of([SystemPermission.ManageProjects]));
      service.load().subscribe();

      service
        .canManageProject(projectId)
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(true);
          done();
        });
    });

    it('should return true with ProjectPermission.ManageProject for specific project', (done) => {
      const mockClaims: ProjectPermissionsClaim[] = [
        {
          projectId: projectId,
          permissions: [ProjectPermission.ManageProject],
        },
      ];
      (
        projectPermissionsService.getMyProjectPermissions as jasmine.Spy
      ).and.returnValue(of(mockClaims));
      service.loadProjectPermissions().subscribe();

      service
        .canManageProject(projectId)
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(true);
          done();
        });
    });

    it('should return false without ManageProjects system permission or ManageProject project permission', (done) => {
      service
        .canManageProject(projectId)
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(false);
          done();
        });
    });

    it('should return false with project permission for different project', (done) => {
      const mockClaims: ProjectPermissionsClaim[] = [
        {
          projectId: 'different-project',
          permissions: [ProjectPermission.ManageProject],
        },
      ];
      (
        projectPermissionsService.getMyProjectPermissions as jasmine.Spy
      ).and.returnValue(of(mockClaims));
      service.loadProjectPermissions().subscribe();

      service
        .canManageProject(projectId)
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(false);
          done();
        });
    });
  });

  describe('canAdminLockProject', () => {
    const projectId = 'project-123';

    beforeEach(() => {
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of([]));
      (
        projectPermissionsService.getMyProjectPermissions as jasmine.Spy
      ).and.returnValue(of([]));
      service.load().subscribe();
      service.loadProjectPermissions().subscribe();
    });

    it('should return true with SystemPermission.LockFiles', (done) => {
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of([SystemPermission.LockFiles]));
      service.load().subscribe();

      service
        .canAdminLockProject(projectId)
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(true);
          done();
        });
    });

    it('should return true with ProjectPermission.LockFiles for specific project', (done) => {
      const mockClaims: ProjectPermissionsClaim[] = [
        {
          projectId: projectId,
          permissions: [ProjectPermission.LockFiles],
        },
      ];
      (
        projectPermissionsService.getMyProjectPermissions as jasmine.Spy
      ).and.returnValue(of(mockClaims));
      service.loadProjectPermissions().subscribe();

      service
        .canAdminLockProject(projectId)
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(true);
          done();
        });
    });

    it('should return false without LockFiles permission', (done) => {
      service
        .canAdminLockProject(projectId)
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(false);
          done();
        });
    });
  });

  describe('Permission Hierarchy', () => {
    const projectId = 'project-123';

    it('should allow system-level EditProjects to override lack of project-level EditProject', (done) => {
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of([SystemPermission.EditProjects]));
      service.load().subscribe();

      // No project-level permissions
      (
        projectPermissionsService.getMyProjectPermissions as jasmine.Spy
      ).and.returnValue(of([]));
      service.loadProjectPermissions().subscribe();

      service
        .canEditProject(projectId)
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(true);
          done();
        });
    });

    it('should allow system-level ManageProjects to work on any project', (done) => {
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of([SystemPermission.ManageProjects]));
      service.load().subscribe();

      const mockClaims: ProjectPermissionsClaim[] = [
        {
          projectId: 'different-project',
          permissions: [ProjectPermission.ViewProject],
        },
      ];
      (
        projectPermissionsService.getMyProjectPermissions as jasmine.Spy
      ).and.returnValue(of(mockClaims));
      service.loadProjectPermissions().subscribe();

      // Should work even though project permission is for different project
      service
        .canManageProject(projectId)
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(true);
          done();
        });
    });

    it('should not allow project-level permission to grant access to different project', (done) => {
      (
        systemPermissionsService.getMySystemPermissions as jasmine.Spy
      ).and.returnValue(of([]));
      service.load().subscribe();

      const mockClaims: ProjectPermissionsClaim[] = [
        {
          projectId: 'different-project',
          permissions: [ProjectPermission.ManageProject],
        },
      ];
      (
        projectPermissionsService.getMyProjectPermissions as jasmine.Spy
      ).and.returnValue(of(mockClaims));
      service.loadProjectPermissions().subscribe();

      service
        .canManageProject(projectId)
        .pipe(take(1))
        .subscribe((can) => {
          expect(can).toBe(false);
          done();
        });
    });
  });
});
