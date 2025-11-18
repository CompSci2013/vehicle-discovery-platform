/*
  DEMO MODULE

  PURPOSE:
  Organizes demo/sandbox components for BaseTableComponent development.

  CONTENTS:
  - Demo page component
  - Demo configurations

  NOTE:
  Static demo data has been removed. Components now use real API calls.

  USAGE:
  Import this module in app.module.ts to enable demo functionality.
*/

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    // Demo components will be added here
  ],
  imports: [
    CommonModule
  ],
  providers: [
    // No demo-specific providers - using shared ApiService
  ]
})
export class DemoModule { }
