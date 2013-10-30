def update_json(file_path, updates)
  json = JSON.parse(File.read(file_path))
  json.merge!(updates)
  File.write(file_path, JSON.pretty_generate(json))
end

desc "Update the library version in package.json, bower.json, and component.json"
task :update_version do
  require "json"

  if (version = ENV['VERSION']).nil?
    puts "Set the VERSION environment variable for this Rake task."
    exit
  end

  update_json('package.json', { 'version' => version })
  update_json('bower.json', { 'version' => version })
  update_json('component.json', { 'version' => version })
end

namespace :gen do
  desc "Generate documentation using Breakneck"
  task :docs do
    sequence_types = [
      "Lazy",
      "Sequence",
      "Iterator",
      "ArrayLikeSequence",
      "ObjectLikeSequence",
      "StringLikeSequence",
      "GeneratedSequence",
      "AsyncSequence"
    ]

    sh "breakneck -n #{sequence_types.join(',')} --tagged public -j ../lazy.js lazy.js"
  end
end
