def compile_file(output)
  require "closure-compiler"
  compiler = Closure::Compiler.new({
    :js_output_file => "#{output.chomp('.js')}.min.js",
    :externs        => File.join("lib", "externs.js"),
    :warning_level  => "VERBOSE"
  })

  puts compiler.compile_file(output)
end

namespace :compile do
  desc "Compile lazy.js"
  task :lib do
    compile_file("lazy.js")
  end

  desc "Compile the homepage (currently hosted on GitHub pages)"
  task :site do
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

    # Find the Travis build status icon and add GitHub and Twitter buttons.
    travis_image = fragment.css("a[href='https://travis-ci.org/dtao/lazy.js']").first
    travis_image.parent["class"] = "sharing"
    share_fragment = Nokogiri::HTML::fragment(File.read(File.join("site", "share.html")))
    travis_image.add_next_sibling(share_fragment)

    # Add IDs to section headings.
    fragment.css("h1,h2").each do |node|
      title = node.content
      node["id"] = title.downcase.gsub(/\s+/, "-").gsub(/[^\w\-]/, "")
    end

    # Add a distinguishing class to the 'Available functions' list so we can style it.
    fragment.css("#available-functions ~ ul").each do |node|
      node["class"] = "functions-list"
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

  desc "Compile documentation"
  task :docs do
    system "jsdoc lib --recurse --destination docs"
  end
end
