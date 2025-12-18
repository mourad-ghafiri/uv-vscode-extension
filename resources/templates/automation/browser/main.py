"""
{{PROJECT_NAME}} - Browser Automation with Playwright
"""
from playwright.sync_api import sync_playwright


def take_screenshot(url: str, output: str = "screenshot.png"):
    """Take a screenshot of a webpage."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url)
        page.screenshot(path=output)
        browser.close()
        print(f"Screenshot saved to {output}")


def scrape_page(url: str) -> dict:
    """Scrape basic info from a webpage."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url)
        
        result = {
            "title": page.title(),
            "url": page.url,
            "headings": page.locator("h1, h2, h3").all_text_contents()[:5],
        }
        browser.close()
        return result


def main():
    """Main entry point."""
    url = "https://example.com"
    
    print(f"Taking screenshot of {url}...")
    take_screenshot(url)
    
    print(f"\nScraping {url}...")
    info = scrape_page(url)
    print(f"Title: {info['title']}")
    print(f"URL: {info['url']}")
    print(f"Headings: {info['headings']}")


if __name__ == "__main__":
    main()
