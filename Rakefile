require "maruku"
require "nokogiri"
require "pygments"

PATH_TO_CLOSURE_COMPILER = "[path to compiler.jar goes here]"

namespace :compile do
  desc "Compile lazy.js"
  task :lib do
    files = %w(
      sequence
      indexed_sequence
      caching_sequence
      mapped_sequence
      filtered_sequence
      reversed_sequence
      take_sequence
      drop_sequence
      sorted_sequence
      shuffled_sequence
      grouped_sequence
      counted_sequence
      unique_sequence
      flattened_sequence
      without_sequence
      union_sequence
      intersection_sequence
      zipped_sequence
      generated_sequence
      init
    )
    
    javascripts = files.map do |f|
      File.read(File.join("lib", "#{f}.js"))
    end

    File.open("lazy.js", "w") do |f|
      f.write("(function(exports) {\n\n")
      f.write(javascripts.join("\n").gsub(/^(?!$)/, "  "))
      f.write("\n}(typeof exports !== 'undefined' ? exports : window));")
    end

    `java -jar #{PATH_TO_CLOSURE_COMPILER} lazy.js > lazy.min.js`
  end

  # This doesn't actually work so well right now. Need to spend some time
  # fixing this task.
  desc "Compile README.md to HTML"
  task :readme do
    markdown = File.read("README.md")

    # Translate to HTML w/ Maruku.
    raw_html = Maruku.new(markdown).to_html

    # Parse HTML using Nokogiri.
    fragment = Nokogiri::HTML::fragment(html)

    # Do syntax highlighting w/ Pygments.
    fragment.css("code").each do |node|
      node = node.parent
      language = node["lang"]
      if language
        highlighted_html = Pygments.highlight(node.content, :lexer => language)
        replacement = Nokogiri::HTML::fragment(highlighted_html)
        node.replace(replacement)
      end
    end

    File.open("index.html", "w") do |f|
      f.write(fragment.inner_html)
    end
  end
end
