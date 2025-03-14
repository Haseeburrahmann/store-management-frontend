// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { APP_CONSTANTS } from './core/utils/app-constants';
import { Title } from '@angular/platform-browser';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {
  constructor(private titleService: Title) {}
  ngOnInit() {
    this.titleService.setTitle(APP_CONSTANTS.APP_FULL_NAME);
  }
}