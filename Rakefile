require "json"

def package_info
  JSON.parse(File.read('package.json'))
end

def update_json(file_path, updates)
  json = JSON.parse(File.read(file_path))
  json.merge!(updates)
  File.write(file_path, JSON.pretty_generate(json))
end

def format_options(options)
  options.map { |key, value| "--#{key} #{value}" }.join(" ")
end

desc "Update the library version in package.json, bower.json, and component.json"
task :update_version do
  if (version = ENV['VERSION']).nil?
    puts "Set the VERSION environment variable for this Rake task."
    exit
  end

  update_json('package.json', { 'version' => version })
  update_json('bower.json', { 'version' => version })
  update_json('component.json', { 'version' => version })
end

desc "Generate documentation using Breakneck"
task :generate_docs do
  sequence_types = [
    "Lazy",
    "Sequence",
    "ArrayLikeSequence",
    "ObjectLikeSequence",
    "StringLikeSequence",
    "GeneratedSequence",
    "AsyncSequence",
    "Iterator",
    "AsyncHandle"
  ]

  options = {
    :namespaces => sequence_types.join(","),
    :template => "autodoc/index.html.mustache",
    :handlers => "autodoc/handlers.js",
    :partials => "autodoc/",
    :output => "site/build/docs",
    :'template-data' => "version:#{package_info['version']}"
  }

  sh "autodoc #{format_options(options)} lazy.js"
end
