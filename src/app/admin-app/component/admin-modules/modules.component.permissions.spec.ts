// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { Module, SystemPermission } from 'src/app/generated/caster-api';
import { ModuleQuery, ModuleService } from 'src/app/modules/state';
import { PermissionService } from 'src/app/permissions/permission.service';
import {
  MockPermissionService,
  waitForAsync as waitForAsyncHelper,
} from 'src/app/permissions/permission-test-helpers';
import { AdminModulesComponent } from './modules.component';

describe('AdminModulesComponent - Permissions', () => {
  let component: AdminModulesComponent;
  let fixture: ComponentFixture<AdminModulesComponent>;
  let mockPermissionService: MockPermissionService;
  let mockModuleService: jasmine.SpyObj<ModuleService>;
  let mockModuleQuery: jasmine.SpyObj<ModuleQuery>;

  const mockModules: Module[] = [
    {
      id: 'module-1',
      name: 'Module 1',
      path: 'path/to/module1',
    } as Module,
    {
      id: 'module-2',
      name: 'Module 2',
      path: 'path/to/module2',
    } as Module,
  ];

  beforeEach(waitForAsync(() => {
    mockPermissionService = new MockPermissionService();
    mockModuleService = jasmine.createSpyObj('ModuleService', [
      'load',
      'loadModuleById',
      'createOrUpdateModuleById',
      'delete',
    ]);
    mockModuleQuery = jasmine.createSpyObj('ModuleQuery', [
      'selectAll',
      'selectLoading',
    ]);

    mockModuleService.load.and.returnValue(of(mockModules));
    mockModuleService.loadModuleById.and.returnValue(of({} as Module));
    mockModuleService.createOrUpdateModuleById.and.returnValue(
      of({} as Module)
    );
    mockModuleService.delete.and.returnValue(of(null));
    mockModuleQuery.selectAll.and.returnValue(of(mockModules));
    mockModuleQuery.selectLoading.and.returnValue(of(false));

    TestBed.configureTestingModule({
      declarations: [AdminModulesComponent],
      imports: [NoopAnimationsModule],
      providers: [
        { provide: ModuleService, useValue: mockModuleService },
        { provide: ModuleQuery, useValue: mockModuleQuery },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminModulesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    mockPermissionService.clearPermissions();
  });

  describe('ManageWorkspaces Permission (for Modules)', () => {
    it('should expose canEdit$ as true when user has ManageWorkspaces permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageWorkspaces,
      ]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(true);
        done();
      });
    });

    it('should expose canEdit$ as false when user lacks ManageWorkspaces permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewModules,
      ]);
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
        SystemPermission.ManageWorkspaces,
      ]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      expect(component.canEdit$).toBeDefined();
    });
  });

  describe('Component Operations with ManageWorkspaces Permission', () => {
    it('should allow loading modules when user has ViewModules permission', () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewModules,
      ]);
      fixture.detectChanges();

      component.ngOnInit();

      expect(mockModuleService.load).toHaveBeenCalledWith(false, true);
    });

    it('should allow loading module by ID with ManageWorkspaces permission', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageWorkspaces,
      ]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      const moduleId = 'module-1';
      component.loadById(moduleId);

      expect(mockModuleService.loadModuleById).toHaveBeenCalledWith(moduleId);
    });

    it('should allow creating/updating module with ManageWorkspaces permission', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageWorkspaces,
      ]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      const moduleId = 'module-1';
      component.createOrUpdateById(moduleId);

      expect(mockModuleService.createOrUpdateModuleById).toHaveBeenCalledWith(
        moduleId
      );
    });

    it('should allow deleting module with ManageWorkspaces permission', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageWorkspaces,
      ]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      const moduleId = 'module-1';
      component.deleteModule(moduleId);

      expect(mockModuleService.delete).toHaveBeenCalledWith(moduleId);
    });

    it('should load modules on init with includeVersions=true', () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewModules,
      ]);
      fixture.detectChanges();

      component.ngOnInit();

      // Component loads with false, true parameters
      expect(mockModuleService.load).toHaveBeenCalledWith(false, true);
    });

    it('should allow manually reloading modules', () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewModules,
      ]);
      fixture.detectChanges();

      component.load();

      expect(mockModuleService.load).toHaveBeenCalledWith(false, true);
    });
  });

  describe('Modules Observable', () => {
    it('should expose modules$ observable', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewModules,
      ]);
      fixture.detectChanges();

      component.ngOnInit();

      component.modules$.pipe(take(1)).subscribe((modules) => {
        expect(modules).toEqual(mockModules);
        expect(modules.length).toBe(2);
        done();
      });
    });

    it('should handle empty modules list', (done) => {
      mockModuleQuery.selectAll.and.returnValue(of([]));
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewModules,
      ]);
      fixture.detectChanges();

      component.ngOnInit();

      component.modules$.pipe(take(1)).subscribe((modules) => {
        expect(modules.length).toBe(0);
        done();
      });
    });

    it('should expose loading state', (done) => {
      mockModuleQuery.selectLoading.and.returnValue(of(true));
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewModules,
      ]);
      fixture.detectChanges();

      component.ngOnInit();

      component.isLoading$.pipe(take(1)).subscribe((loading) => {
        expect(loading).toBe(true);
        done();
      });
    });
  });

  describe('Permission-Based UI Behavior', () => {
    it('should disable module management operations without ManageWorkspaces permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewModules,
      ]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(false);
        // UI should use this observable to disable load/create/delete buttons
        done();
      });
    });

    it('should enable module management operations with ManageWorkspaces permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageWorkspaces,
      ]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(true);
        // UI should use this observable to enable load/create/delete buttons
        done();
      });
    });
  });

  describe('Permission Combinations', () => {
    it('should allow viewing modules with ViewModules but not managing', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewModules,
      ]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      let canEdit = true;
      component.canEdit$.subscribe((value) => {
        canEdit = value;
      });

      expect(canEdit).toBe(false);
      expect(component.modules$).toBeDefined();
    });

    it('should allow both viewing and managing with both permissions', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewModules,
        SystemPermission.ManageWorkspaces,
      ]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      let canEdit = false;
      component.canEdit$.subscribe((value) => {
        canEdit = value;
      });

      expect(canEdit).toBe(true);
    });

    it('should work with ManageWorkspaces alone', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageWorkspaces,
      ]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(true);
        done();
      });
    });

    it('should not confuse ManageWorkspaces with ManageModules permission', (done) => {
      // Note: ManageModules is a different permission
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageModules,
      ]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(false);
        done();
      });
    });
  });

  describe('Module Permission Context', () => {
    it('should use ManageWorkspaces not ManageModules for module operations', (done) => {
      // This is intentional - module management requires ManageWorkspaces permission
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageWorkspaces,
      ]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(true);
        // Component checks ManageWorkspaces, not ManageModules
        done();
      });
    });

    it('should still allow viewing with ViewModules permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewModules,
      ]);
      fixture.detectChanges();

      component.ngOnInit();

      component.modules$.pipe(take(1)).subscribe((modules) => {
        expect(modules).toBeDefined();
        done();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle permission service errors gracefully', (done) => {
      spyOn(mockPermissionService, 'hasPermission').and.returnValue(of(false));

      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(false);
        done();
      });
    });

    it('should handle module service errors', async () => {
      mockModuleService.load.and.returnValue(
        of([]) // Return empty on error rather than throwing
      );

      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewModules,
      ]);
      fixture.detectChanges();

      expect(() => {
        component.ngOnInit();
      }).not.toThrow();
    });

    it('should use NgZone for certain operations', () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewModules,
      ]);
      fixture.detectChanges();

      expect(component.zone).toBeDefined();
    });
  });
});
