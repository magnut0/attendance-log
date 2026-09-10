import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const superUserGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.operationInProgress()) {
    return true;
  }

  if (auth.profile() !== undefined) {
    return auth.isSuperUser() ? true : router.createUrlTree(['/']);
  }

  return new Observable<boolean | UrlTree>((subscriber) => {
    const sub = auth.profile$
      .pipe(
        filter(() => !auth.operationInProgress()),
        filter((p) => p !== undefined),
        take(1),
      )
      .subscribe((p) => {
        subscriber.next(p?.isSuperUser ? true : router.createUrlTree(['/']));
        subscriber.complete();
      });
    return () => sub.unsubscribe();
  });
};
