# Sitemap Testing Guide

## Quick Testing Methods

### 1. **Browser Testing (Easiest)**

#### Test Static Files Locally:
1. Start your dev server: `npm start`
2. Open these URLs in your browser:
   - `http://localhost:4200/sitemap.xml` - Should show sitemap index
   - `http://localhost:4200/sitemap-static.xml` - Should show static pages
   - `http://localhost:4200/robots.txt` - Should reference sitemap

#### Test Production URLs:
- `https://tehranemoon.app/sitemap.xml`
- `https://tehranemoon.app/sitemap-static.xml`
- `https://tehranemoon.app/api/sitemap/places` (backend endpoint)
- `https://tehranemoon.app/robots.txt`

**What to check:**
- ✅ XML displays correctly (not as text)
- ✅ All URLs are valid
- ✅ No syntax errors visible
- ✅ Proper XML structure

---

### 2. **Command Line Testing (cURL)**

#### Test Sitemap Index:
```bash
curl -I https://tehranemoon.app/sitemap.xml
```
**Expected:** `HTTP/1.1 200 OK` and `Content-Type: application/xml` or `text/xml`

#### Test Static Sitemap:
```bash
curl https://tehranemoon.app/sitemap-static.xml
```
**Expected:** Valid XML output

#### Test Backend API Endpoint:
```bash
curl https://tehranemoon.app/api/sitemap/places
```
**Expected:** XML with place URLs

#### Test Robots.txt:
```bash
curl https://tehranemoon.app/robots.txt
```
**Expected:** Should contain `Sitemap: https://tehranemoon.app/sitemap.xml`

---

### 3. **Online XML Validators**

#### XML Validation:
- **XML Validator**: https://www.xmlvalidation.com/
  - Paste your XML or enter URL
  - Check for syntax errors

- **FreeFormatter**: https://www.freeformatter.com/xml-validator-xsd.html
  - Validates against XML Schema

#### Sitemap-Specific Validators:
- **XML Sitemaps Validator**: https://www.xml-sitemaps.com/validate-xml-sitemap.html
  - Validates sitemap protocol compliance
  - Checks URL accessibility
  - Verifies lastmod dates

- **Sitemap Validator Tool**: https://www.sitemaps.org/protocol.html
  - Official sitemap protocol reference

---

### 4. **Browser Developer Tools**

#### Check Response Headers:
1. Open DevTools (F12)
2. Go to Network tab
3. Navigate to `https://tehranemoon.app/sitemap.xml`
4. Check headers:
   - ✅ `Content-Type: application/xml` or `text/xml; charset=utf-8`
   - ✅ `Status: 200 OK`
   - ✅ `Cache-Control` (if set by backend)

#### Validate XML Structure:
1. Open sitemap in browser
2. Right-click → "View Page Source"
3. Check for:
   - ✅ Proper XML declaration
   - ✅ Correct namespace: `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`
   - ✅ Valid XML tags
   - ✅ No unclosed tags

---

### 5. **Automated Testing Scripts**

#### PowerShell Script (Windows):
```powershell
# Test sitemap URLs
$urls = @(
    "https://tehranemoon.app/sitemap.xml",
    "https://tehranemoon.app/sitemap-static.xml",
    "https://tehranemoon.app/api/sitemap/places"
)

foreach ($url in $urls) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing
        Write-Host "$url : $($response.StatusCode) - $($response.Headers['Content-Type'])" -ForegroundColor Green
    }
    catch {
        Write-Host "$url : ERROR - $($_.Exception.Message)" -ForegroundColor Red
    }
}
```

#### Bash Script (Linux/Mac):
```bash
#!/bin/bash
# Test sitemap URLs
urls=(
    "https://tehranemoon.app/sitemap.xml"
    "https://tehranemoon.app/sitemap-static.xml"
    "https://tehranemoon.app/api/sitemap/places"
)

for url in "${urls[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    content_type=$(curl -s -I "$url" | grep -i "content-type" | cut -d' ' -f2)
    echo "$url : $status - $content_type"
done
```

---

### 6. **Google Search Console Testing**

#### Submit and Validate:
1. Go to https://search.google.com/search-console
2. Select your property (`tehranemoon.app`)
3. Navigate to **Sitemaps** (left sidebar)
4. Enter: `https://tehranemoon.app/sitemap.xml`
5. Click **Submit**
6. Wait for validation (usually within minutes)
7. Check status:
   - ✅ **Success**: "Sitemap processed successfully"
   - ❌ **Errors**: Review error messages

#### Check Coverage:
1. Go to **Coverage** report
2. Check indexed pages
3. Verify place pages are being discovered

---

### 7. **Testing Checklist**

#### Static Files:
- [ ] `sitemap.xml` is accessible
- [ ] `sitemap-static.xml` is accessible
- [ ] Both files return valid XML
- [ ] XML structure is correct
- [ ] All URLs use HTTPS
- [ ] All URLs are absolute (not relative)
- [ ] `lastmod` dates are in `YYYY-MM-DD` format
- [ ] `priority` values are between 0.0 and 1.0
- [ ] `changefreq` values are valid (always, hourly, daily, weekly, monthly, yearly, never)

#### Backend API:
- [ ] `/api/sitemap/places` returns 200 OK
- [ ] Response is valid XML
- [ ] Contains all published places
- [ ] URLs are correctly formatted (`https://tehranemoon.app/place/{id}`)
- [ ] `lastmod` dates are accurate
- [ ] Response headers include correct Content-Type
- [ ] Caching headers are set appropriately

#### Robots.txt:
- [ ] `robots.txt` is accessible
- [ ] Contains sitemap reference
- [ ] Sitemap URL is correct
- [ ] Format is correct: `Sitemap: https://tehranemoon.app/sitemap.xml`

#### Integration:
- [ ] Sitemap index references both static and dynamic sitemaps
- [ ] All referenced sitemaps are accessible
- [ ] No broken links
- [ ] URLs in sitemap match actual routes

---

### 8. **Common Issues & Solutions**

#### Issue: XML displays as text
**Solution:** Check `Content-Type` header is `application/xml` or `text/xml`

#### Issue: "Invalid XML" error
**Solution:** 
- Check for unclosed tags
- Verify XML encoding is UTF-8
- Ensure special characters are escaped

#### Issue: URLs return 404
**Solution:**
- Verify route structure matches sitemap URLs
- Check that place IDs exist in database
- Ensure backend API is running

#### Issue: Google Search Console errors
**Solution:**
- Verify sitemap is publicly accessible (no auth required)
- Check all URLs return 200 status
- Ensure XML is well-formed
- Wait 24-48 hours for Google to process

---

### 9. **Quick Test Commands**

#### Test all endpoints at once:
```bash
# Windows (PowerShell)
@("https://tehranemoon.app/sitemap.xml", "https://tehranemoon.app/sitemap-static.xml", "https://tehranemoon.app/api/sitemap/places") | ForEach-Object { Write-Host "Testing $_"; curl -I $_ }

# Linux/Mac
for url in "https://tehranemoon.app/sitemap.xml" "https://tehranemoon.app/sitemap-static.xml" "https://tehranemoon.app/api/sitemap/places"; do echo "Testing $url"; curl -I "$url"; done
```

#### Validate XML locally:
```bash
# Using xmllint (Linux/Mac)
xmllint --noout --schema http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd sitemap.xml

# Using PowerShell (Windows)
[xml]$xml = Get-Content sitemap-static.xml
$xml.DocumentElement | Select-Object -ExpandProperty Name
```

---

### 10. **Expected Results**

#### Sitemap Index (`sitemap.xml`):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://tehranemoon.app/sitemap-static.xml</loc>
    <lastmod>2024-01-15</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://tehranemoon.app/api/sitemap/places</loc>
    <lastmod>2024-01-15</lastmod>
  </sitemap>
</sitemapindex>
```

#### Static Sitemap (`sitemap-static.xml`):
- Should contain 5 URLs (home, about, contact, rules, report-bugs)
- All URLs should be accessible
- Proper priority and changefreq values

#### Backend API (`/api/sitemap/places`):
- Should contain all published place URLs
- Format: `https://tehranemoon.app/place/{id}`
- Each URL should have lastmod, changefreq, and priority

---

## Testing Priority

1. **High Priority**: Test locally first, then production
2. **Medium Priority**: Validate XML structure
3. **Low Priority**: Submit to Google Search Console (can wait until production)

---

## Next Steps After Testing

1. ✅ Fix any XML validation errors
2. ✅ Verify all URLs are accessible
3. ✅ Submit to Google Search Console
4. ✅ Monitor indexing status
5. ✅ Update `lastmod` dates when pages change

