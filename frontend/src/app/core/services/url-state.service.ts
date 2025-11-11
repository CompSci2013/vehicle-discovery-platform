import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UrlStateService {
   private queryParamsSubject = new BehaviorSubject<any>({});
  public queryParams$ = this.queryParamsSubject.asObservable();

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    // We'll add initialization logic here next
  }
}
