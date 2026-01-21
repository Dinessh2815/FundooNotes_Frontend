import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkModeSubject = new BehaviorSubject<boolean>(false);
  public darkMode$ = this.darkModeSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      // Load saved theme preference
      const savedTheme = localStorage.getItem('theme');
      const isDark = savedTheme === 'dark';
      this.setDarkMode(isDark, false);
    }
  }

  toggleDarkMode(): void {
    const newValue = !this.darkModeSubject.value;
    this.setDarkMode(newValue, true);
  }

  private setDarkMode(isDark: boolean, save: boolean = true): void {
    this.darkModeSubject.next(isDark);
    
    if (isPlatformBrowser(this.platformId)) {
      if (isDark) {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }
      
      if (save) {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      }
    }
  }

  isDarkMode(): boolean {
    return this.darkModeSubject.value;
  }
}
