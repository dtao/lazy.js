def compile_file(output, source_files)
  javascripts = source_files.map do |f|
    File.read(File.join("lib", "#{f}.js"))
  end

  File.open(output, "w") do |f|
    f.write("(function(exports) {\n\n")
    f.write(javascripts.join("\n").gsub(/^(?!$)/, "  "))
    f.write("\n}(typeof exports !== 'undefined' ? exports : window));")
  end

  compiled = Closure::Compiler.new.compile(File.read(output))
  File.open("#{output.chomp('.js')}.min.js", "w") do |f|
    f.write(compiled)
  end
end

namespace :compile do
  desc "Compile lazy.js"
  task :lib do
    require "closure-compiler"

    compile_file("lazy.js", %w[
      sequence
      sequence_iterator
      set
      indexed_sequence
      caching_sequence
      mapped_sequence
      filtered_sequence
      reversed_sequence
      concatenated_sequence
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
      async_sequence
      string_wrapper
      string_match_sequence
      split_string_sequence
      init
    ])

    compile_file("lazy.dom.js", %w[
      event_sequence
      init_dom
    ])
  end

  desc "Compile README.md to HTML"
  task :docs do
    require "mustache"
    require "nokogiri"
    require "pygments"
    require "redcarpet"

    markdown = File.read("README.md")

    # Translate to HTML w/ Redcarpet.
    renderer = Redcarpet::Markdown.new(Redcarpet::Render::HTML, :fenced_code_blocks => true)
    raw_html = renderer.render(markdown)

    # Parse HTML using Nokogiri.
    fragment = Nokogiri::HTML::fragment(raw_html)

    # Add IDs to section headings.
    fragment.css("h1,h2").each do |node|
      title = node.content
      node["id"] = title.downcase.gsub(/\s+/, "-").gsub(/[^\w\-]/, "")
    end

    # Do syntax highlighting w/ Pygments.
    fragment.css("code").each do |node|
      language = node["class"]
      if language
        highlighted_html = Pygments.highlight(node.content, :lexer => language)
        replacement = Nokogiri::HTML::fragment(highlighted_html)
        node.parent.replace(replacement)
      end
    end

    # Inject README into Mustache template.
    template = File.read("index.html.mustache")
    final_html = Mustache.render(template, :readme => fragment.inner_html)

    # Finally, write the rendered result to index.html.
    File.open("index.html", "w") do |f|
      f.write(final_html)
    end
  end
end
