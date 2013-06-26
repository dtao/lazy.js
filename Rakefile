def compile_file(output)
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
    require "redcarpet"

    # OK so here's a hack: I'm going to strip out the first and last lines from
    # lazy.js so that JSDoc can read the annotations. (There is almost certainly
    # a more acceptable way to do this; but this is going to work so whatever.)
    #
    # Pretty awesome, right?
    full_source = File.read("lazy.js").lines[1..-2].join
    File.open("temp.js", "w") do |f|
      f.write(full_source)
    end

    # Get a JSON representation of our JSDoc comments.
    classes = JSON.parse(`jsdoc temp.js --template templates/lazy`)

    # OK, I want to massage this data a little bit...
    classes.each_with_index do |class_data, index|
      class_data["methods"].each do |method_data|
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

    # I called it temp.js for a reason, you guys!
    File.delete("temp.js")

    docs_index_template = File.read("docs/index.html.mustache")
    docs_index_html = Mustache.render(docs_index_template, { :classes => classes })

    File.open("docs/index.html", "w") do |f|
      f.write(docs_index_html)
    end

    class_template = File.read("docs/class.html.mustache")
    classes.each do |class_data|
      html = Mustache.render(class_template, {
        :name    => class_data["name"],
        :methods => class_data["methods"]
      })

      File.open("docs/#{class_data['name']}.html", "w") do |f|
        f.write(html)
      end
    end
  end
end
