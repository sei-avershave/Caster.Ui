// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { SystemPermission, User } from 'src/app/generated/caster-api';
import { PermissionService } from 'src/app/permissions/permission.service';
import {
  MockPermissionService,
  waitForAsync as waitForAsyncHelper,
} from 'src/app/permissions/permission-test-helpers';
import { UserQuery, UserService } from 'src/app/users/state';
import { UsersComponent } from './users.component';

describe('UsersComponent - Permissions', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let mockPermissionService: MockPermissionService;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockUserQuery: jasmine.SpyObj<UserQuery>;

  const mockUsers: User[] = [
    { id: 'user-1', name: 'User 1' } as User,
    { id: 'user-2', name: 'User 2' } as User,
  ];

  beforeEach(waitForAsync(() => {
    mockPermissionService = new MockPermissionService();
    mockUserService = jasmine.createSpyObj('UserService', [
      'load',
      'create',
      'delete',
    ]);
    mockUserQuery = jasmine.createSpyObj('UserQuery', [
      'selectAll',
      'selectLoading',
    ]);

    mockUserService.load.and.returnValue(of(mockUsers));
    mockUserService.create.and.returnValue(of({} as User));
    mockUserService.delete.and.returnValue(of(null));
    mockUserQuery.selectAll.and.returnValue(of(mockUsers));
    mockUserQuery.selectLoading.and.returnValue(of(false));

    TestBed.configureTestingModule({
      declarations: [UsersComponent],
      imports: [NoopAnimationsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: UserQuery, useValue: mockUserQuery },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    mockPermissionService.clearPermissions();
  });

  describe('ManageUsers Permission', () => {
    it('should expose canEdit$ as true when user has ManageUsers permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageUsers,
      ]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(true);
        done();
      });
    });

    it('should expose canEdit$ as false when user lacks ManageUsers permission', (done) => {
      mockPermissionService.setSystemPermissions([SystemPermission.ViewUsers]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(false);
        done();
      });
    });

    it('should expose canEdit$ as false when user has no permissions', (done) => {
      mockPermissionService.setSystemPermissions([]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(false);
        done();
      });
    });

    it('should initialize canEdit$ observable on component creation', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageUsers,
      ]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      expect(component.canEdit$).toBeDefined();
    });
  });

  describe('Component Operations with ManageUsers Permission', () => {
    it('should allow creating user when user has ManageUsers permission', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageUsers,
      ]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      const newUser = { name: 'New User' } as User;
      component.create(newUser);

      expect(mockUserService.create).toHaveBeenCalledWith(newUser);
    });

    it('should allow deleting user when user has ManageUsers permission', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageUsers,
      ]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      const userId = 'user-1';
      component.deleteUser(userId);

      expect(mockUserService.delete).toHaveBeenCalledWith(userId);
    });

    it('should load users on init regardless of permissions', () => {
      mockPermissionService.setSystemPermissions([]);
      fixture.detectChanges();

      component.ngOnInit();

      expect(mockUserService.load).toHaveBeenCalled();
    });

    it('should display users observable', (done) => {
      mockPermissionService.setSystemPermissions([SystemPermission.ViewUsers]);
      fixture.detectChanges();

      component.ngOnInit();

      component.users$.pipe(take(1)).subscribe((users) => {
        expect(users).toEqual(mockUsers);
        expect(users.length).toBe(2);
        done();
      });
    });
  });

  describe('Permission-Based UI Behavior', () => {
    it('should disable create/delete operations without ManageUsers permission', (done) => {
      mockPermissionService.setSystemPermissions([SystemPermission.ViewUsers]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(false);
        // UI should use this observable to disable buttons
        done();
      });
    });

    it('should enable create/delete operations with ManageUsers permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageUsers,
      ]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(true);
        // UI should use this observable to enable buttons
        done();
      });
    });
  });

  describe('Permission Combinations', () => {
    it('should allow viewing users with ViewUsers but not editing', async () => {
      mockPermissionService.setSystemPermissions([SystemPermission.ViewUsers]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      let canEdit = true;
      component.canEdit$.subscribe((value) => {
        canEdit = value;
      });

      expect(canEdit).toBe(false);
      expect(mockUserQuery.selectAll).toBeDefined();
    });

    it('should allow both viewing and managing with both permissions', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewUsers,
        SystemPermission.ManageUsers,
      ]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      let canEdit = false;
      component.canEdit$.subscribe((value) => {
        canEdit = value;
      });

      expect(canEdit).toBe(true);
    });

    it('should work with ManageUsers alone (implies viewing)', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageUsers,
      ]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(true);
        done();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user list', async () => {
      mockUserQuery.selectAll.and.returnValue(of([]));
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageUsers,
      ]);
      fixture.detectChanges();

      component.ngOnInit();
      await waitForAsyncHelper(fixture);

      component.users$.pipe(take(1)).subscribe((users) => {
        expect(users.length).toBe(0);
      });
    });

    it('should handle permission service errors gracefully', () => {
      spyOn(mockPermissionService, 'hasPermission').and.throwError(
        'Permission error'
      );

      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle loading state', (done) => {
      mockUserQuery.selectLoading.and.returnValue(of(true));
      mockPermissionService.setSystemPermissions([SystemPermission.ViewUsers]);
      fixture.detectChanges();

      component.ngOnInit();

      component.isLoading$.pipe(take(1)).subscribe((loading) => {
        expect(loading).toBe(true);
        done();
      });
    });
  });
});
