/*
  DEMO MODULE

  PURPOSE:
  Organizes demo/sandbox components and services for BaseTableComponent development.

  CONTENTS:
  - DemoApiService: Mock API with demo data
  - Demo page component (to be created)
  - Demo configurations (to be created)

  USAGE:
  Import this module in app.module.ts to enable demo functionality.
*/

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DemoApiService } from './demo-api.service';

@NgModule({
  declarations: [
    // Demo components will be added here
  ],
  imports: [
    CommonModule
  ],
  providers: [
    DemoApiService
  ]
})
export class DemoModule { }
