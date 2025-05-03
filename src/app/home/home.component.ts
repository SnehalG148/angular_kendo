
                                            

import { Component, OnInit, Renderer2, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { KENDO_BUTTONS } from "@progress/kendo-angular-buttons";
import { RouterOutlet } from "@angular/router";
import { LeadheaderComponent } from "../leadheader/leadheader.component";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    CommonModule,
    KENDO_BUTTONS,
    RouterOutlet, 
    LeadheaderComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  themeText = 'Light Mode';
  themeIcon = 'fas fa-sun';
  isDarkMode = false;
  activeButton: string = 'LEAD MANAGEMENT';

  constructor(
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadTheme();
  }

  toggleTheme() {
    if (isPlatformBrowser(this.platformId)) {
      this.isDarkMode = !this.isDarkMode;
      this.themeText = this.isDarkMode ? 'Dark Mode' : 'Light Mode';
      this.themeIcon = this.isDarkMode ? 'fas fa-moon' : 'fas fa-sun';

      if (this.isDarkMode) {
        this.renderer.addClass(document.body, 'dark-mode');
        localStorage.setItem('theme', 'dark');
        this.renderer.addClass(document.body, 'k-theme-dark');
      } else {
        this.renderer.removeClass(document.body, 'dark-mode');
        this.renderer.removeClass(document.body, 'k-theme-dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }

  loadTheme() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme') || 'light';
      if (savedTheme === 'dark') {
        this.isDarkMode = true;
        this.themeText = 'Dark Mode';
        this.themeIcon = 'fas fa-moon';
        this.renderer.addClass(document.body, 'dark-mode');
        this.renderer.addClass(document.body, 'k-theme-dark');
      }
    }
  }

  setActiveButton(buttonName: string) {
    this.activeButton = buttonName;
  }
}