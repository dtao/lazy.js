def compile_file(output)
  source_files = %w(
    sequence
    iterator
    array_like_sequence
    object_like_sequence
    string_like_sequence
    generated_sequence
    async_sequence
    stream_like_sequence
    main
  )

  contents = source_files.map do |f|
    File.read("lib/#{f}.js").gsub(/^([^\n])/, '  \1')
  end

  javascript = [
    '(function(context) {',
    *contents,
    '}(typeof global !== "undefined" ? global : window));'
  ].join("\n")

  File.open(output, "w") { |f| f.write(javascript) }

  require "closure-compiler"
  compiler = Closure::Compiler.new({
    :js_output_file => "#{output.chomp('.js')}.min.js",
    :externs        => File.join("lib", "externs.js"),
    :warning_level  => "VERBOSE"
  })

  puts compiler.compile_file(output)
end

# Take a Nokogiri HTML fragment and run its code blocks through Pygments.
def syntax_highlight!(fragment)
  fragment.css("code").each do |node|
    language = node["class"]
    if language
      highlighted_html = Pygments.highlight(node.content, :lexer => language)
      replacement = Nokogiri::HTML::fragment(highlighted_html)
      node.parent.replace(replacement)
    end
  end
end

# This is a simple hack to render single-line strings (or anyway, short text)
# from Markdown to HTML without wrapping in a <p> element.
def simple_markdown(text)
  return "" if text.nil?
  @renderer ||= Redcarpet::Markdown.new(Redcarpet::Render::HTML)
  html = @renderer.render(text)[3...-3]
  html.gsub(/\{@link ([^}]*)\}/, '<code>\1</code>')
end

def normalize_methods!(methods)
  methods.each do |method_data|
    method_data["description"] = simple_markdown(method_data["description"])

    (params = method_data["params"]) && params.each do |param_data|
      param_data["type"] = param_data["type"]["names"].join("|")
      param_data["description"] = simple_markdown(param_data["description"])
    end
    method_data["params"] = { :list => params } unless params.nil? || params.empty?

    (returns = method_data["returns"]) && returns.each do |returns_data|
      returns_data["type"] = returns_data["type"]["names"].join("|")
      returns_data["description"] = simple_markdown(returns_data["description"])
    end
    method_data["returns"] = { :list => returns } unless returns.nil? || returns.empty?
  end
end

namespace :compile do
  desc "Compile everything (the library, the site, and the API docs)"
  task :all => [:lib, :site, :docs]

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

    # Do syntax highlighting w/ Pygments.
    syntax_highlight!(fragment)

    # Inject README into Mustache template.
    template = File.read("index.html.mustache")
    final_html = Mustache.render(template, { :readme => fragment.inner_html })

    # Finally, write the rendered result to index.html.
    File.open("index.html", "w") do |f|
      f.write(final_html)
    end
  end

  desc "Compile the API docs"
  task :docs do
    require "json"
    require "mustache"
    require "nokogiri"
    require "pygments"
    require "redcarpet"

    # Get a JSON representation of our JSDoc comments.
    classes = JSON.parse(`jsdoc lib --recurse --template templates/lazy`)

    # OK, I want to massage this data a little bit...
    classes.each_with_index do |class_data, index|
      normalize_methods!([class_data["constructor"]])
      normalize_methods!(class_data["instanceMethods"])
      normalize_methods!(class_data["staticMethods"])
      class_data["methods"] = class_data["staticMethods"] + class_data["instanceMethods"]
      class_data["anyStaticMethods"] = class_data["staticMethods"].any?
      class_data["anyInstanceMethods"] = class_data["instanceMethods"].any?
    end

    Mustache.template_path = "docs/templates"

    class IndexTemplate < Mustache; end
    docs_index_html = IndexTemplate.render(:classes => classes)

    File.open("docs/index.html", "w") do |f|
      f.write(docs_index_html)
    end

    class ClassTemplate < Mustache; end
    classes.each do |class_data|
      html = ClassTemplate.render(class_data)

      document = Nokogiri::HTML(html)
      syntax_highlight!(document)

      File.open("docs/#{class_data['name']}.html", "w") do |f|
        f.write(document.inner_html)
      end
    end
  end
end
