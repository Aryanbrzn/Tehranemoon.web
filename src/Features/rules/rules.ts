import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountdownComponent } from '../countdown/countdown';
import { RouterModule } from '@angular/router';
import { Footer } from '../../Shared/footer/footer';
import { SEOService } from '../../Core/services/seo.service';
import { environment } from '../../environments/environment';

@Component({
    selector: 'app-rules',
    standalone: true,
    imports: [CommonModule, RouterModule, CountdownComponent, Footer],
    templateUrl: './rules.html',
    styleUrl: './rules.css'
})
export class RulesComponent implements OnInit {
    private seoService = inject(SEOService);

    ngOnInit() {
        this.seoService.updateTags({
            title: 'قوانین و مقررات - تهرانمون',
            description: 'قوانین و مقررات استفاده از پلتفرم تهرانمون. آشنایی با قوانین ثبت نظر، امتیازدهی و استفاده از خدمات تهرانمون.',
            keywords: 'قوانین تهرانمون, مقررات تهرانمون, قوانین استفاده, شرایط استفاده',
            url: `${environment.webUrl}/rules`,
            type: 'website',
            structuredData: {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "قوانین و مقررات",
                "description": "قوانین و مقررات استفاده از پلتفرم تهرانمون",
                "url": `${environment.webUrl}/rules`
            }
        });
    }
}
