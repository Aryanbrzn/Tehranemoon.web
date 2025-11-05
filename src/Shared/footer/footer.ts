import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer {
  // Image error handler - fallback to no-image.png
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src && !img.src.includes('no-image.png')) {
      img.src = 'images/no-image.png';
    }
  }
}
