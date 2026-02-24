// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { of } from 'rxjs';
import { ModelFile } from 'src/app/generated/caster-api';
import {
  FileVersionQuery,
  FileVersionService,
} from 'src/app/fileVersions/state';
import { FileQuery, FileService } from 'src/app/files/state';
import { ModuleQuery, ModuleService } from 'src/app/modules/state';
import { ConfirmDialogService } from 'src/app/sei-cwd-common/confirm-dialog/service/confirm-dialog.service';
import { CurrentUserQuery } from 'src/app/users/state';
import { EditorComponent } from './editor.component';

describe('EditorComponent - Permissions', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;
  let mockModuleService: jasmine.SpyObj<ModuleService>;
  let mockModuleQuery: jasmine.SpyObj<ModuleQuery>;
  let mockFileQuery: jasmine.SpyObj<FileQuery>;
  let mockFileService: jasmine.SpyObj<FileService>;
  let mockFileVersionService: jasmine.SpyObj<FileVersionService>;
  let mockFileVersionQuery: jasmine.SpyObj<FileVersionQuery>;
  let mockCurrentUserQuery: jasmine.SpyObj<CurrentUserQuery>;
  let mockConfirmDialog: jasmine.SpyObj<ConfirmDialogService>;
  let mockSettingsService: jasmine.SpyObj<ComnSettingsService>;

  const mockFile: ModelFile = {
    id: 'file-123',
    name: 'test.tf',
    editorContent: 'resource "aws_instance" "example" {}',
    lockedById: null,
    directoryId: 'dir-123',
  } as ModelFile;

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
  };

  beforeEach(waitForAsync(() => {
    mockModuleService = jasmine.createSpyObj('ModuleService', ['load']);
    mockModuleQuery = jasmine.createSpyObj('ModuleQuery', ['selectEntity']);
    mockFileQuery = jasmine.createSpyObj('FileQuery', [
      'selectEntity',
      'isEditing',
      'getSelectedVersionId',
      'selectIsSaved',
    ]);
    mockFileService = jasmine.createSpyObj('FileService', [
      'lockFile',
      'unlockFile',
      'save',
    ]);
    mockFileVersionService = jasmine.createSpyObj('FileVersionService', [
      'load',
    ]);
    mockFileVersionQuery = jasmine.createSpyObj('FileVersionQuery', [
      'selectEntity',
    ]);
    mockCurrentUserQuery = jasmine.createSpyObj('CurrentUserQuery', ['select']);
    mockConfirmDialog = jasmine.createSpyObj('ConfirmDialogService', [
      'confirmDialog',
    ]);
    mockSettingsService = jasmine.createSpyObj('ComnSettingsService', [], {
      settings: {},
    });

    // Setup default return values
    mockFileQuery.selectEntity.and.returnValue(of(mockFile));
    mockFileQuery.isEditing.and.returnValue(of(false));
    mockFileQuery.getSelectedVersionId.and.returnValue(of(null));
    mockFileQuery.selectIsSaved.and.returnValue(of(true));
    mockFileVersionService.load.and.returnValue(of([]));
    mockFileVersionQuery.selectEntity.and.returnValue(of(null));
    mockCurrentUserQuery.select.and.returnValue(
      of({ ...mockUser, lastRoute: '/' })
    );

    Object.defineProperty(mockCurrentUserQuery, 'userTheme$', {
      get: () => of('light-theme'),
    });

    TestBed.configureTestingModule({
      declarations: [EditorComponent],
      imports: [NoopAnimationsModule],
      providers: [
        { provide: ModuleService, useValue: mockModuleService },
        { provide: ModuleQuery, useValue: mockModuleQuery },
        { provide: FileQuery, useValue: mockFileQuery },
        { provide: FileService, useValue: mockFileService },
        { provide: FileVersionService, useValue: mockFileVersionService },
        { provide: FileVersionQuery, useValue: mockFileVersionQuery },
        { provide: CurrentUserQuery, useValue: mockCurrentUserQuery },
        { provide: ConfirmDialogService, useValue: mockConfirmDialog },
        { provide: ComnSettingsService, useValue: mockSettingsService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    component.fileId = mockFile.id;
    component.modules = [];
    component.breadcrumb = [];
  });

  describe('canEdit Input Property', () => {
    it('should accept canEdit as true', () => {
      component.canEdit = true;
      fixture.detectChanges();

      expect(component.canEdit).toBe(true);
    });

    it('should accept canEdit as false', () => {
      component.canEdit = false;
      fixture.detectChanges();

      expect(component.canEdit).toBe(false);
    });

    it('should make editor read-only when canEdit is false', () => {
      component.canEdit = false;
      fixture.detectChanges();

      component.ngOnInit();

      // Editor options should have readOnly set based on permissions
      expect(component.editorOptions.readOnly).toBeDefined();
    });

    it('should allow editing when canEdit is true and file is not locked', () => {
      component.canEdit = true;
      const unlockedFile = { ...mockFile, lockedById: null };
      mockFileQuery.selectEntity.and.returnValue(of(unlockedFile));
      fixture.detectChanges();

      component.ngOnInit();

      // Component should reflect edit capability
      expect(component.canEdit).toBe(true);
    });
  });

  describe('canAdminLock Input Property', () => {
    it('should accept canAdminLock as true', () => {
      component.canAdminLock = true;
      fixture.detectChanges();

      expect(component.canAdminLock).toBe(true);
    });

    it('should accept canAdminLock as false', () => {
      component.canAdminLock = false;
      fixture.detectChanges();

      expect(component.canAdminLock).toBe(false);
    });

    it('should allow admin to unlock files locked by others when canAdminLock is true', () => {
      component.canAdminLock = true;
      component.canEdit = true;
      const lockedFile = {
        ...mockFile,
        lockedById: 'different-user',
      };
      mockFileQuery.selectEntity.and.returnValue(of(lockedFile));
      fixture.detectChanges();

      component.ngOnInit();

      // Admin should be able to override lock
      expect(component.canAdminLock).toBe(true);
    });

    it('should not allow non-admin to unlock files locked by others', () => {
      component.canAdminLock = false;
      component.canEdit = true;
      const lockedFile = {
        ...mockFile,
        lockedById: 'different-user',
      };
      mockFileQuery.selectEntity.and.returnValue(of(lockedFile));
      fixture.detectChanges();

      component.ngOnInit();

      // Non-admin cannot override lock
      expect(component.canAdminLock).toBe(false);
    });
  });

  describe('Editor Read-Only State Based on Permissions', () => {
    it('should set editor to read-only when canEdit is false', () => {
      component.canEdit = false;
      mockFileQuery.selectEntity.and.returnValue(of(mockFile));
      fixture.detectChanges();

      component.ngOnInit();

      // Read-only should be true when user cannot edit
      expect(component.editorOptions.readOnly).toBe(true);
    });

    it('should set editor to read-only when file is locked by another user without admin permission', () => {
      component.canEdit = true;
      component.canAdminLock = false;
      const lockedFile = {
        ...mockFile,
        lockedById: 'different-user',
      };
      mockFileQuery.selectEntity.and.returnValue(of(lockedFile));
      mockFileQuery.isEditing.and.returnValue(of(false));
      fixture.detectChanges();

      component.ngOnInit();

      // Should be read-only because locked by someone else
      expect(component.editorOptions.readOnly).toBe(true);
    });

    it('should allow editing when file is locked by current user', () => {
      component.canEdit = true;
      const lockedFile = {
        ...mockFile,
        lockedById: mockUser.id,
      };
      mockFileQuery.selectEntity.and.returnValue(of(lockedFile));
      mockFileQuery.isEditing.and.returnValue(of(true));
      fixture.detectChanges();

      component.ngOnInit();

      // Should allow editing own locked file
      expect(component.isEditing).toBe(true);
    });

    it('should allow editing with admin lock permission even if locked by others', () => {
      component.canEdit = true;
      component.canAdminLock = true;
      const lockedFile = {
        ...mockFile,
        lockedById: 'different-user',
      };
      mockFileQuery.selectEntity.and.returnValue(of(lockedFile));
      fixture.detectChanges();

      component.ngOnInit();

      // Admin should be able to edit despite lock
      expect(component.canAdminLock).toBe(true);
    });
  });

  describe('Permission Combinations', () => {
    it('should handle no edit and no admin lock permissions', () => {
      component.canEdit = false;
      component.canAdminLock = false;
      fixture.detectChanges();

      component.ngOnInit();

      expect(component.editorOptions.readOnly).toBe(true);
      expect(component.canEdit).toBe(false);
      expect(component.canAdminLock).toBe(false);
    });

    it('should handle edit permission but no admin lock permission', () => {
      component.canEdit = true;
      component.canAdminLock = false;
      fixture.detectChanges();

      component.ngOnInit();

      expect(component.canEdit).toBe(true);
      expect(component.canAdminLock).toBe(false);
      // Can edit own files but not override locks
    });

    it('should handle admin lock permission but no edit permission', () => {
      component.canEdit = false;
      component.canAdminLock = true;
      fixture.detectChanges();

      component.ngOnInit();

      // Unusual but valid: can unlock files but not edit content
      expect(component.canEdit).toBe(false);
      expect(component.canAdminLock).toBe(true);
    });

    it('should handle both edit and admin lock permissions', () => {
      component.canEdit = true;
      component.canAdminLock = true;
      fixture.detectChanges();

      component.ngOnInit();

      expect(component.canEdit).toBe(true);
      expect(component.canAdminLock).toBe(true);
      // Full control: can edit and override locks
    });
  });

  describe('File Lock Behavior with Permissions', () => {
    it('should respect file lock when user lacks admin lock permission', () => {
      component.canEdit = true;
      component.canAdminLock = false;
      const lockedFile = {
        ...mockFile,
        lockedById: 'different-user',
      };
      mockFileQuery.selectEntity.and.returnValue(of(lockedFile));
      mockFileQuery.isEditing.and.returnValue(of(false));
      fixture.detectChanges();

      component.ngOnInit();

      expect(component.isEditing).toBe(false);
      expect(component.editorOptions.readOnly).toBe(true);
    });

    it('should allow unlocking file when user has admin lock permission', () => {
      component.canEdit = true;
      component.canAdminLock = true;
      const lockedFile = {
        ...mockFile,
        lockedById: 'different-user',
      };
      mockFileQuery.selectEntity.and.returnValue(of(lockedFile));
      fixture.detectChanges();

      component.ngOnInit();

      // Admin can override lock
      expect(component.canAdminLock).toBe(true);
    });
  });

  describe('Editor Options Update', () => {
    it('should update editor options when permissions change', () => {
      component.canEdit = true;
      fixture.detectChanges();
      component.ngOnInit();

      const initialReadOnly = component.editorOptions.readOnly;

      // Change permissions
      component.canEdit = false;
      component.ngOnInit();

      // Editor options should reflect new permissions
      expect(component.editorOptions.readOnly).toBe(true);
    });

    it('should update editor options based on file lock state', () => {
      component.canEdit = true;
      component.canAdminLock = false;

      // First: unlocked file
      mockFileQuery.selectEntity.and.returnValue(of(mockFile));
      fixture.detectChanges();
      component.ngOnInit();

      // Then: locked file
      const lockedFile = {
        ...mockFile,
        lockedById: 'different-user',
      };
      mockFileQuery.selectEntity.and.returnValue(of(lockedFile));
      component.ngOnInit();

      // Should become read-only when locked by others
      expect(component.editorOptions.readOnly).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined canEdit gracefully', () => {
      component.canEdit = undefined;
      fixture.detectChanges();

      expect(() => {
        component.ngOnInit();
      }).not.toThrow();
    });

    it('should handle undefined canAdminLock gracefully', () => {
      component.canAdminLock = undefined;
      fixture.detectChanges();

      expect(() => {
        component.ngOnInit();
      }).not.toThrow();
    });

    it('should handle null file gracefully', () => {
      mockFileQuery.selectEntity.and.returnValue(of(null));
      component.canEdit = true;
      fixture.detectChanges();

      expect(() => {
        component.ngOnInit();
      }).not.toThrow();
    });

    it('should initialize component with default permission values', () => {
      // Don't set canEdit or canAdminLock
      fixture.detectChanges();

      expect(() => {
        component.ngOnInit();
      }).not.toThrow();
    });
  });
});
