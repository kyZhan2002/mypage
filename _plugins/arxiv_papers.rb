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
      FileUtils.mkdir_p('_data') unless File.directory?('_data')
      
      papers = load_cached_data
      if !papers || papers.empty?
        papers = fetch_papers
        save_cache(papers) if papers && !papers.empty?
      end
      
      site.data['arxiv_papers'] = papers || []
    rescue => e
      Jekyll.logger.error "ArxivPapers:", "Failed to generate papers: #{e.message}"
      site.data['arxiv_papers'] = load_cached_data || []
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
      
      uri = URI.parse("https://export.arxiv.org/api/query?#{query}")
      
      Jekyll.logger.info "ArxivPapers:", "Fetching papers from arXiv..."
      
      response = Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
        http.read_timeout = 30
        http.open_timeout = 30
        http.get(uri.request_uri, {
          'User-Agent' => 'Mozilla/5.0 (Jekyll Paper Fetcher; mailto:kzhan@g.harvard.edu)'
        })
      end

      Jekyll.logger.info "ArxivPapers:", "Response status: #{response.code}"
      
      unless response.is_a?(Net::HTTPSuccess)
        Jekyll.logger.error "ArxivPapers:", "Failed with status: #{response.code}"
        Jekyll.logger.error "ArxivPapers:", "Response body: #{response.body}"
        raise "Failed to fetch papers: #{response.code}"
      end

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

      if papers.empty?
        Jekyll.logger.error "ArxivPapers:", "No papers found in response"
        Jekyll.logger.error "ArxivPapers:", "Response body: #{response.body}"
        raise "No papers found"
      end

      Jekyll.logger.info "ArxivPapers:", "Successfully fetched #{papers.size} papers"
      papers

    rescue StandardError => e
      Jekyll.logger.error "ArxivPapers:", "Error fetching papers: #{e.message}"
      Jekyll.logger.error "ArxivPapers:", e.backtrace.join("\n")
      cached = load_cached_data
      return cached if cached && !cached.empty?
      raise "Failed to fetch papers and no valid cache found"
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