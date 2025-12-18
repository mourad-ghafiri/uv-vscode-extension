"""
{{PROJECT_NAME}} - Web Scraper with Scrapy
"""
import scrapy
from scrapy.crawler import CrawlerProcess


class QuotesSpider(scrapy.Spider):
    """Spider to scrape quotes from quotes.toscrape.com."""
    
    name = "quotes"
    start_urls = ["https://quotes.toscrape.com/"]
    
    def parse(self, response):
        """Parse the response and extract quotes."""
        for quote in response.css("div.quote"):
            yield {
                "text": quote.css("span.text::text").get(),
                "author": quote.css("small.author::text").get(),
                "tags": quote.css("div.tags a.tag::text").getall(),
            }
        
        # Follow pagination
        next_page = response.css("li.next a::attr(href)").get()
        if next_page:
            yield response.follow(next_page, self.parse)


def main():
    """Run the spider."""
    process = CrawlerProcess(settings={
        "FEEDS": {"quotes.json": {"format": "json"}},
        "LOG_LEVEL": "INFO",
    })
    process.crawl(QuotesSpider)
    process.start()
    print("\nResults saved to quotes.json")


if __name__ == "__main__":
    main()
