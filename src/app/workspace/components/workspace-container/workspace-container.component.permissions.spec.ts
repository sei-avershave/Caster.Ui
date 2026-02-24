// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { SystemPermission } from 'src/app/generated/caster-api';
import { PermissionService } from 'src/app/permissions/permission.service';
import {
  MockPermissionService,
  waitForAsync as waitForAsyncHelper,
} from 'src/app/permissions/permission-test-helpers';
import { ConfirmDialogService } from 'src/app/sei-cwd-common/confirm-dialog/service/confirm-dialog.service';
import { SignalRService } from 'src/app/shared/signalr/signalr.service';
import { CurrentUserQuery } from 'src/app/users/state';
import { WorkspaceQuery, WorkspaceService } from '../../state';
import { WorkspaceContainerComponent } from './workspace-container.component';

describe('WorkspaceContainerComponent - Permissions', () => {
  let component: WorkspaceContainerComponent;
  let fixture: ComponentFixture<WorkspaceContainerComponent>;
  let mockPermissionService: MockPermissionService;
  let mockWorkspaceService: jasmine.SpyObj<WorkspaceService>;
  let mockWorkspaceQuery: jasmine.SpyObj<WorkspaceQuery>;
  let mockSignalRService: jasmine.SpyObj<SignalRService>;
  let mockConfirmService: jasmine.SpyObj<ConfirmDialogService>;
  let mockCurrentUserQuery: jasmine.SpyObj<CurrentUserQuery>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const workspaceId = 'workspace-123';

  beforeEach(waitForAsync(() => {
    mockPermissionService = new MockPermissionService();
    mockWorkspaceService = jasmine.createSpyObj('WorkspaceService', [
      'createPlanRun',
      'rejectRun',
      'cancelRun',
      'applyRun',
      'saveState',
      'taint',
      'untaint',
      'remove',
      'refreshResources',
      'expandRun',
      'loadResource',
      'expandResource',
      'setStatusFilters',
      'loadRunsByWorkspaceId',
      'loadResourcesByWorkspaceId',
      'setWorkspaceView',
      'planOutputUpdated',
      'applyOutputUpdated',
    ]);
    mockWorkspaceQuery = jasmine.createSpyObj('WorkspaceQuery', [
      'selectLoading',
      'selectEntity',
      'workspaceRuns$',
      'workspaceResources$',
      'expandedRuns$',
      'expandedResources$',
      'selectedRuns$',
      'resourceActions$',
      'resourceAction$',
      'filters$',
      'getWorkspaceView',
    ]);
    mockSignalRService = jasmine.createSpyObj('SignalRService', [
      'joinWorkspace',
      'leaveWorkspace',
    ]);
    mockConfirmService = jasmine.createSpyObj('ConfirmDialogService', [
      'confirmDialog',
    ]);
    mockCurrentUserQuery = jasmine.createSpyObj('CurrentUserQuery', ['select']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    // Setup default return values
    mockWorkspaceQuery.selectLoading.and.returnValue(of(false));
    mockWorkspaceQuery.selectEntity.and.returnValue(of(null));
    mockWorkspaceQuery.workspaceRuns$.and.returnValue(of([]));
    mockWorkspaceQuery.workspaceResources$.and.returnValue(of([]));
    mockWorkspaceQuery.expandedRuns$.and.returnValue(of([]));
    mockWorkspaceQuery.expandedResources$.and.returnValue(of([]));
    mockWorkspaceQuery.selectedRuns$.and.returnValue(of(null));
    mockWorkspaceQuery.resourceActions$.and.returnValue(of([]));
    mockWorkspaceQuery.resourceAction$.and.returnValue(of(null));
    mockWorkspaceQuery.filters$.and.returnValue(of([]));
    mockWorkspaceQuery.getWorkspaceView.and.returnValue(of('runs'));

    TestBed.configureTestingModule({
      declarations: [WorkspaceContainerComponent],
      imports: [NoopAnimationsModule, MatButtonToggleModule],
      providers: [
        { provide: WorkspaceService, useValue: mockWorkspaceService },
        { provide: WorkspaceQuery, useValue: mockWorkspaceQuery },
        { provide: SignalRService, useValue: mockSignalRService },
        { provide: ConfirmDialogService, useValue: mockConfirmService },
        { provide: CurrentUserQuery, useValue: mockCurrentUserQuery },
        { provide: MatDialog, useValue: mockDialog },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceContainerComponent);
    component = fixture.componentInstance;
    component.workspaceId = workspaceId;
    component.breadcrumb = [];
    component.canEdit = true;
  });

  afterEach(() => {
    mockPermissionService.clearPermissions();
  });

  describe('ImportResources Permission', () => {
    it('should expose canImport$ as true when user has ImportResources permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ImportResources,
      ]);
      fixture.detectChanges();

      component.canImport$.pipe(take(1)).subscribe((canImport) => {
        expect(canImport).toBe(true);
        done();
      });
    });

    it('should expose canImport$ as false when user lacks ImportResources permission', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewWorkspaces,
      ]);
      fixture.detectChanges();

      component.canImport$.pipe(take(1)).subscribe((canImport) => {
        expect(canImport).toBe(false);
        done();
      });
    });

    it('should expose canImport$ as false when user has no permissions', (done) => {
      mockPermissionService.setSystemPermissions([]);
      fixture.detectChanges();

      component.canImport$.pipe(take(1)).subscribe((canImport) => {
        expect(canImport).toBe(false);
        done();
      });
    });

    it('should initialize canImport$ observable on ngOnInit', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ImportResources,
      ]);

      component.ngOnInit();
      await waitForAsyncHelper(fixture);

      expect(component.canImport$).toBeDefined();
    });

    it('should check ImportResources permission specifically, not other workspace permissions', (done) => {
      // User can view and manage workspaces, but not import resources
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewWorkspaces,
        SystemPermission.ManageWorkspaces,
      ]);
      fixture.detectChanges();

      component.canImport$.pipe(take(1)).subscribe((canImport) => {
        expect(canImport).toBe(false);
        done();
      });
    });
  });

  describe('Component Behavior with ImportResources Permission', () => {
    it('should allow opening import dialog when user has ImportResources permission', async () => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ImportResources,
      ]);
      fixture.detectChanges();
      await waitForAsyncHelper(fixture);

      const dialogRef = {
        close: jasmine.createSpy('close'),
        afterClosed: () => of({ wasCancelled: true }),
      };
      mockDialog.open.and.returnValue(dialogRef as any);

      // Mock the template ref
      component.importResourceDialog = {} as any;

      component.openImportResourceDialog();

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should properly initialize SignalR connection regardless of import permission', () => {
      mockPermissionService.setSystemPermissions([]);
      fixture.detectChanges();

      expect(mockSignalRService.joinWorkspace).toHaveBeenCalledWith(
        workspaceId
      );
    });

    it('should properly clean up SignalR connection on destroy', () => {
      mockPermissionService.setSystemPermissions([]);
      fixture.detectChanges();

      component.ngOnDestroy();

      expect(mockSignalRService.leaveWorkspace).toHaveBeenCalledWith(
        workspaceId
      );
    });
  });

  describe('Permission State Changes', () => {
    it('should react to permission changes', async () => {
      // Start with no permissions
      mockPermissionService.setSystemPermissions([]);
      fixture.detectChanges();

      let canImportValue = true; // Set opposite of expected
      component.canImport$.subscribe((value) => {
        canImportValue = value;
      });
      expect(canImportValue).toBe(false);

      // Grant ImportResources permission
      mockPermissionService.setSystemPermissions([
        SystemPermission.ImportResources,
      ]);
      await waitForAsyncHelper(fixture);

      // Reinitialize to pick up new permissions
      component.ngOnInit();
      await waitForAsyncHelper(fixture);

      component.canImport$.subscribe((value) => {
        canImportValue = value;
      });
      expect(canImportValue).toBe(true);
    });
  });

  describe('Multiple Permissions', () => {
    it('should correctly handle user with multiple workspace-related permissions', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewWorkspaces,
        SystemPermission.ManageWorkspaces,
        SystemPermission.ImportResources,
      ]);
      fixture.detectChanges();

      component.canImport$.pipe(take(1)).subscribe((canImport) => {
        expect(canImport).toBe(true);
        done();
      });
    });

    it('should correctly handle user with many permissions but not ImportResources', (done) => {
      mockPermissionService.setSystemPermissions([
        SystemPermission.ViewWorkspaces,
        SystemPermission.ManageWorkspaces,
        SystemPermission.ViewProjects,
        SystemPermission.ManageProjects,
        SystemPermission.ViewUsers,
        SystemPermission.ManageUsers,
      ]);
      fixture.detectChanges();

      component.canImport$.pipe(take(1)).subscribe((canImport) => {
        expect(canImport).toBe(false);
        done();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined workspaceId gracefully', () => {
      component.workspaceId = undefined;
      mockPermissionService.setSystemPermissions([
        SystemPermission.ImportResources,
      ]);

      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle permission service errors gracefully', (done) => {
      spyOn(mockPermissionService, 'hasPermission').and.returnValue(of(false));

      fixture.detectChanges();

      component.canImport$.pipe(take(1)).subscribe((canImport) => {
        expect(canImport).toBe(false);
        done();
      });
    });
  });
});
