import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountdownComponent } from '../countdown/countdown';
import { RouterModule } from '@angular/router';
import { Footer } from '../../Shared/footer/footer';

@Component({
    selector: 'app-rules',
    standalone: true,
    imports: [CommonModule, RouterModule, CountdownComponent, Footer],
    templateUrl: './rules.html',
    styleUrl: './rules.css'
})
export class RulesComponent {

}
