import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountdownComponent } from '../countdown/countdown';
import { RouterModule } from '@angular/router';
import { Footer } from '../../Shared/footer/footer';
import { SEOService } from '../../Core/services/seo.service';
import { environment } from '../../environments/environment';

@Component({
    selector: 'app-about-us',
    standalone: true,
    imports: [CommonModule, RouterModule, CountdownComponent, Footer],
    templateUrl: './about-us.html',
    styleUrl: './about-us.css'
})
export class AboutUsComponent implements OnInit {
    private seoService = inject(SEOService);

    ngOnInit() {
        this.seoService.updateTags({
            title: 'درباره تهرانمون - راهنمای بهترین مکان‌های تهران',
            description: 'تهرانمون پلتفرمی است که به شما کمک می‌کند تا بهترین مکان‌های تهران را کشف کنید. از رستوران‌های محلی گرفته تا جاذبه‌های گردشگری، ما تمام آنچه که تهران زیبا ارائه می‌دهد را در یک جا جمع کرده‌ایم.',
            keywords: 'درباره تهرانمون, تیم تهرانمون, ماموریت تهرانمون, ویژگی‌های تهرانمون, راهنمای تهران',
            url: `${environment.webUrl}/about`,
            type: 'website',
            structuredData: {
                "@context": "https://schema.org",
                "@type": "AboutPage",
                "name": "درباره تهرانمون",
                "description": "تهرانمون پلتفرمی است که به شما کمک می‌کند تا بهترین مکان‌های تهران را کشف کنید.",
                "url": `${environment.webUrl}/about`,
                "mainEntity": {
                    "@type": "Organization",
                    "name": "تهرانمون",
                    "description": "پلتفرم راهنمای بهترین مکان‌های تهران"
                }
            }
        });
    }
}
