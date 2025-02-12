require 'net/http'
require 'uri'
require 'json'
require 'nokogiri'
require 'date'
require 'fileutils'

module Jekyll
  class ArxivPapers < Generator
    CACHE_FILE = '_data/arxiv_cache.json'
    CACHE_DURATION = 86400  # 24 hours in seconds

    def generate(site)
      papers = load_cached_data || fetch_papers
      
      if papers
        save_cache(papers)
        site.data['arxiv_papers'] = papers
      else
        # Fallback to empty array if both cache and fetch fail
        site.data['arxiv_papers'] = []
      end
    end

    private

    def load_cached_data
      return nil unless File.exist?(CACHE_FILE)
      
      cache_data = JSON.parse(File.read(CACHE_FILE))
      return nil if cache_data['timestamp'].to_i < (Time.now.to_i - CACHE_DURATION)
      
      cache_data['papers']
    rescue JSON::ParserError
      nil
    end

    def save_cache(papers)
      cache_data = {
        'timestamp' => Time.now.to_i,
        'papers' => papers
      }

      FileUtils.mkdir_p('_data')
      File.write(CACHE_FILE, JSON.pretty_generate(cache_data))
    end

    def fetch_papers
      query = URI.encode_www_form(
        search_query: 'cat:cs.LG+AND+(all:"transfer learning"+OR+all:"distributionally robust")',
        sortBy: 'submittedDate',
        sortOrder: 'descending',
        max_results: 50
      )
      
      uri = URI.parse("https://export.arxiv.org/api/query?#{query}")  # Changed to https
      
      response = Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|  # Added use_ssl: true
        http.read_timeout = 30  # Increased timeout
        http.open_timeout = 30  # Added open_timeout
        http.get(uri.request_uri, {
          'User-Agent' => 'Mozilla/5.0 (Jekyll Paper Fetcher; mailto:kzhan@g.harvard.edu)'  # Updated email
        })
      end

      raise "Failed to fetch papers: #{response.code}" unless response.is_a?(Net::HTTPSuccess)

      doc = Nokogiri::XML(response.body)
      doc.remove_namespaces!

      papers = doc.xpath('//entry').map do |entry|
        {
          'title' => sanitize_text(entry.at_xpath('.//title').text),
          'authors' => entry.xpath('.//author/name').map { |name| sanitize_text(name.text) },
          'abstract' => sanitize_text(entry.at_xpath('.//summary').text),
          'pdf_link' => entry.xpath('.//link[@title="pdf"]/@href').to_s,
          'published' => format_date(entry.at_xpath('.//published').text),
          'arxiv_url' => entry.xpath('.//link[@title="alternate"]/@href').to_s,
          'categories' => entry.xpath('.//category/@term').map(&:to_s)
        }
      end

      raise "No papers found" if papers.empty?
      papers

    rescue StandardError => e
      puts "Error fetching arXiv papers: #{e.message}"
      puts e.backtrace
      load_cached_data || []  # Fallback to cache or empty array
    end

    def sanitize_text(text)
      text.to_s.strip.gsub(/\s+/, ' ')
    end

    def format_date(date_str)
      Date.parse(date_str).strftime('%B %d, %Y')
    rescue ArgumentError
      date_str
    end
  end
end