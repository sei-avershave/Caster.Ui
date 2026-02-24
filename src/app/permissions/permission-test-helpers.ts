// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ProjectPermission,
  ProjectPermissionsClaim,
  SystemPermission,
} from '../generated/caster-api';

/**
 * Mock PermissionService for testing components
 */
export class MockPermissionService {
  private permissionsSubject = new BehaviorSubject<SystemPermission[]>([]);
  public permissions$ = this.permissionsSubject.asObservable();

  private projectPermissionsSubject = new BehaviorSubject<
    ProjectPermissionsClaim[]
  >([]);
  public projectPermissions$ = this.projectPermissionsSubject.asObservable();

  /**
   * Set system permissions for testing
   */
  setSystemPermissions(permissions: SystemPermission[]): void {
    this.permissionsSubject.next(permissions);
  }

  /**
   * Set project permissions for testing
   */
  setProjectPermissions(claims: ProjectPermissionsClaim[]): void {
    this.projectPermissionsSubject.next(claims);
  }

  /**
   * Mock load method
   */
  load(): Observable<SystemPermission[]> {
    return this.permissions$;
  }

  /**
   * Mock loadProjectPermissions method
   */
  loadProjectPermissions(
    projectId?: string
  ): Observable<ProjectPermissionsClaim[]> {
    return this.projectPermissions$;
  }

  /**
   * Mock canViewAdiminstration method
   */
  canViewAdiminstration(): Observable<boolean> {
    return this.permissions$.pipe(
      map((permissions) => permissions.some((p) => p.startsWith('View')))
    );
  }

  /**
   * Mock hasPermission method
   */
  hasPermission(permission: SystemPermission): Observable<boolean> {
    return this.permissions$.pipe(
      map((permissions) => permissions.includes(permission))
    );
  }

  /**
   * Mock canEditProject method
   */
  canEditProject(projectId: string): Observable<boolean> {
    return this.permissions$.pipe(
      map((permissions) => {
        const hasSystemPermission = permissions.includes(
          SystemPermission.EditProjects
        );

        const hasProjectPermission = this.projectPermissionsSubject.value.some(
          (claim) =>
            claim.projectId === projectId &&
            claim.permissions.includes(ProjectPermission.EditProject)
        );

        return hasSystemPermission || hasProjectPermission;
      })
    );
  }

  /**
   * Mock canManageProject method
   */
  canManageProject(projectId: string): Observable<boolean> {
    return this.permissions$.pipe(
      map((permissions) => {
        const hasSystemPermission = permissions.includes(
          SystemPermission.ManageProjects
        );

        const hasProjectPermission = this.projectPermissionsSubject.value.some(
          (claim) =>
            claim.projectId === projectId &&
            claim.permissions.includes(ProjectPermission.ManageProject)
        );

        return hasSystemPermission || hasProjectPermission;
      })
    );
  }

  /**
   * Mock canAdminLockProject method
   */
  canAdminLockProject(projectId: string): Observable<boolean> {
    return this.permissions$.pipe(
      map((permissions) => {
        const hasSystemPermission = permissions.includes(
          SystemPermission.LockFiles
        );

        const hasProjectPermission = this.projectPermissionsSubject.value.some(
          (claim) =>
            claim.projectId === projectId &&
            claim.permissions.includes(ProjectPermission.LockFiles)
        );

        return hasSystemPermission || hasProjectPermission;
      })
    );
  }

  /**
   * Clear all permissions
   */
  clearPermissions(): void {
    this.permissionsSubject.next([]);
    this.projectPermissionsSubject.next([]);
  }
}

/**
 * Helper to create a project permission claim for testing
 */
export function createProjectPermissionClaim(
  projectId: string,
  permissions: ProjectPermission[]
): ProjectPermissionsClaim {
  return {
    projectId,
    permissions,
  };
}

/**
 * Helper to check if an element is visible in the DOM
 */
export function isElementVisible(fixture: any, selector: string): boolean {
  const element = fixture.nativeElement.querySelector(selector);
  return element !== null && element.offsetParent !== null;
}

/**
 * Helper to check if an element is disabled
 */
export function isElementDisabled(fixture: any, selector: string): boolean {
  const element = fixture.nativeElement.querySelector(selector);
  return (
    element !== null && (element.disabled || element.hasAttribute('disabled'))
  );
}

/**
 * Helper to verify async template rendering
 */
export async function waitForAsync(fixture: any): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}
