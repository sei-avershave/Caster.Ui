// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { SystemPermission } from 'src/app/generated/caster-api';
import { PermissionService } from 'src/app/permissions/permission.service';
import {
  MockPermissionService,
  waitForAsync as waitForAsyncHelper,
} from 'src/app/permissions/permission-test-helpers';
import { ProjectQuery } from 'src/app/project';
import { SignalRService } from 'src/app/shared/signalr/signalr.service';
import { VlansComponent } from './vlans.component';

describe('VlansComponent - Permissions', () => {
  let component: VlansComponent;
  let fixture: ComponentFixture<VlansComponent>;
  let mockPermissionService: MockPermissionService;
  let mockProjectQuery: jasmine.SpyObj<ProjectQuery>;
  let mockSignalRService: jasmine.SpyObj<SignalRService>;

  beforeEach(waitForAsync(() => {
    mockPermissionService = new MockPermissionService();
    mockProjectQuery = jasmine.createSpyObj('ProjectQuery', ['selectAll']);
    mockSignalRService = jasmine.createSpyObj('SignalRService', [
      'startConnection',
      'joinVlansAdmin',
      'leaveVlansAdmin',
    ]);

    mockProjectQuery.selectAll.and.returnValue(of([]));
    mockSignalRService.startConnection.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      declarations: [VlansComponent],
      imports: [NoopAnimationsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ProjectQuery, useValue: mockProjectQuery },
        { provide: SignalRService, useValue: mockSignalRService },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VlansComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    mockPermissionService.clearPermissions();
  });

  describe('ManageVLANs Permission', () => {
    it('should expose canEdit$ as true when user has ManageVLANs permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageVlans,
      ]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(true);
        done();
      });
    });

    it('should expose canEdit$ as false when user lacks ManageVLANs permission', (done) => {
      mockPermissionService.setSystemPermissions([SystemPermission.ViewVlans]);
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
        SystemPermission.ManageVlans,
      ]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      expect(component.canEdit$).toBeDefined();
    });
  });

  describe('SignalR Connection with Permissions', () => {
    it('should connect to SignalR and join VlansAdmin on init', async () => {
      mockPermissionService.setSystemPermissions([SystemPermission.ViewVlans]);
      fixture.detectChanges();

      component.ngOnInit();
      await waitForAsyncHelper(fixture);

      expect(mockSignalRService.startConnection).toHaveBeenCalled();
      await mockSignalRService.startConnection();
      expect(mockSignalRService.joinVlansAdmin).toHaveBeenCalled();
    });

    it('should connect to SignalR regardless of ManageVLANs permission', async () => {
      mockPermissionService.setSystemPermissions([]);
      fixture.detectChanges();

      component.ngOnInit();
      await waitForAsyncHelper(fixture);

      // User can view VLANs even without manage permission
      expect(mockSignalRService.startConnection).toHaveBeenCalled();
    });

    it('should leave VlansAdmin on destroy', () => {
      mockPermissionService.setSystemPermissions([SystemPermission.ViewVlans]);
      fixture.detectChanges();

      component.ngOnDestroy();

      expect(mockSignalRService.leaveVlansAdmin).toHaveBeenCalled();
    });
  });

  describe('Permission-Based UI Behavior', () => {
    it('should disable VLAN management operations without ManageVLANs permission', (done) => {
      mockPermissionService.setSystemPermissions([SystemPermission.ViewVlans]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(false);
        // UI should use this observable to disable pool/partition creation/editing
        done();
      });
    });

    it('should enable VLAN management operations with ManageVLANs permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageVlans,
      ]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(true);
        // UI should use this observable to enable pool/partition creation/editing
        done();
      });
    });
  });

  describe('Projects Observable', () => {
    it('should expose projects$ observable', (done) => {
      // projects$ is created in the component field initializer,
      // so it already points to the mock's selectAll() observable.
      // The mock was set to return empty array in beforeEach, so we test with that.
      mockPermissionService.setSystemPermissions([SystemPermission.ViewVlans]);
      fixture.detectChanges();

      component.projects$.pipe(take(1)).subscribe((projects) => {
        // Verify the observable works and returns an array
        expect(Array.isArray(projects)).toBe(true);
        expect(projects).toBeDefined();
        done();
      });
    });

    it('should handle empty projects list', (done) => {
      mockProjectQuery.selectAll.and.returnValue(of([]));
      mockPermissionService.setSystemPermissions([SystemPermission.ViewVlans]);
      fixture.detectChanges();

      component.projects$.pipe(take(1)).subscribe((projects) => {
        expect(projects.length).toBe(0);
        done();
      });
    });
  });

  describe('Permission Combinations', () => {
    it('should allow viewing VLANs with ViewVLANs but not managing', async () => {
      mockPermissionService.setSystemPermissions([SystemPermission.ViewVlans]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      let canEdit = true;
      component.canEdit$.subscribe((value) => {
        canEdit = value;
      });

      expect(canEdit).toBe(false);
      expect(component.projects$).toBeDefined();
    });

    it('should allow both viewing and managing with both permissions', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewVlans,
        SystemPermission.ManageVlans,
      ]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      let canEdit = false;
      component.canEdit$.subscribe((value) => {
        canEdit = value;
      });

      expect(canEdit).toBe(true);
    });

    it('should work with ManageVLANs alone (implies viewing)', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageVlans,
      ]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(true);
        done();
      });
    });

    it('should not confuse ManageVLANs with ViewProjects permission', (done) => {
      // User can view projects but not manage VLANs
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewProjects,
        SystemPermission.ViewVlans,
      ]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(false);
        done();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle SignalR connection errors gracefully', async () => {
      mockSignalRService.startConnection.and.returnValue(
        Promise.reject(new Error('Connection failed'))
      );
      mockPermissionService.setSystemPermissions([SystemPermission.ViewVlans]);

      expect(() => {
        fixture.detectChanges();
        component.ngOnInit();
      }).not.toThrow();
    });

    it('should handle permission service errors gracefully', () => {
      spyOn(mockPermissionService, 'hasPermission').and.throwError(
        'Permission error'
      );

      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should properly clean up on destroy', () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageVlans,
      ]);
      fixture.detectChanges();

      expect(() => {
        component.ngOnDestroy();
      }).not.toThrow();

      expect(mockSignalRService.leaveVlansAdmin).toHaveBeenCalled();
    });
  });

  describe('VLAN-Specific Permission Notes', () => {
    it('should check ManageVLANs specifically, not ManageWorkspaces', (done) => {
      // ManageWorkspaces should NOT grant VLAN management permission
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageWorkspaces,
      ]);
      fixture.detectChanges();

      component.canEdit$.pipe(take(1)).subscribe((canEdit) => {
        expect(canEdit).toBe(false);
        done();
      });
    });

    it('should require ViewProjects for pool assignment context', (done) => {
      // Note: The component exposes projects$ for VLAN pool assignment to projects
      // This requires ViewProjects permission in addition to ManageVLANs
      mockPermissionService.setSystemPermissions([
        SystemPermission.ManageVlans,
        SystemPermission.ViewProjects,
      ]);
      fixture.detectChanges();

      component.projects$.pipe(take(1)).subscribe((projects) => {
        // Projects are available for pool assignment
        expect(projects).toBeDefined();
        done();
      });
    });
  });
});
