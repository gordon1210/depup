#!/bin/bash
# This script generates test packages for testing purposes.

# Create base directory structure
mkdir -p generated/apps generated/packages

# Function to generate random name of length 3 to 9 characters
generate_random_name() {
  length=$(( (RANDOM % 7) + 3 ))
  tr -dc 'a-z' < /dev/urandom | head -c $length
}

# Function to generate random version string
generate_random_version() {
  echo "$((RANDOM % 10)).$((RANDOM % 10)).$((RANDOM % 10))"
}

# Common dependencies to choose from
dependencies=(
  "react"
  "react-dom"
  "express"
  "axios"
  "lodash"
  "moment"
  "uuid"
  "redux"
  "react-redux"
  "typescript"
  "next"
  "vue"
  "svelte"
  "angular"
  "styled-components"
  "webpack"
  "babel"
  "jest"
  "mocha"
  "eslint"
  "prettier"
  "chalk"
  "dotenv"
  "cors"
  "mongodb"
  "mongoose"
  "pg"
  "knex"
  "graphql"
  "apollo-server"
)

# Dev dependencies to choose from
dev_dependencies=(
  "typescript"
  "webpack"
  "webpack-cli"
  "babel-core"
  "babel-loader"
  "@babel/core"
  "@babel/preset-env"
  "@babel/preset-react"
  "@babel/preset-typescript"
  "eslint"
  "prettier"
  "jest"
  "mocha"
  "chai"
  "cypress"
  "nodemon"
  "@types/react"
  "@types/node"
  "@types/jest"
  "ts-jest"
  "ts-node"
  "webpack-dev-server"
  "html-webpack-plugin"
  "css-loader"
  "style-loader"
  "sass-loader"
  "postcss"
  "autoprefixer"
  "husky"
  "lint-staged"
)

# Function to generate a random package.json with dependencies
generate_package_json() {
  name=$1
  is_root=$2

  # Determine number of dependencies and dev dependencies
  num_deps=$((RANDOM % 8 + 2))
  num_dev_deps=$((RANDOM % 6 + 1))

  # Start package.json
  echo "{"
  
  if [ "$is_root" = "true" ]; then
    echo "  \"name\": \"monorepo-root\","
    echo "  \"private\": true,"
    echo "  \"workspaces\": ["
    echo "    \"apps/*\","
    echo "    \"packages/*\""
    echo "  ],"
  else
    echo "  \"name\": \"$name\","
  fi
  
  echo "  \"version\": \"$(generate_random_version)\","
  echo "  \"description\": \"Generated test package $name\","
  echo "  \"main\": \"index.js\","
  echo "  \"scripts\": {"
  echo "    \"test\": \"echo \\\"Error: no test specified\\\" && exit 1\""
  echo "  },"

  # Generate dependencies
  echo "  \"dependencies\": {"
  deps_added=0
  for i in $(shuf -i 0-$((${#dependencies[@]} - 1)) -n $num_deps); do
    deps_added=$((deps_added + 1))
    comma=","
    if [ $deps_added -eq $num_deps ]; then
      comma=""
    fi
    echo "    \"${dependencies[$i]}\": \"^$(generate_random_version)\"$comma"
  done
  echo "  },"

  # Generate devDependencies
  echo "  \"devDependencies\": {"
  deps_added=0
  for i in $(shuf -i 0-$((${#dev_dependencies[@]} - 1)) -n $num_dev_deps); do
    deps_added=$((deps_added + 1))
    comma=","
    if [ $deps_added -eq $num_dev_deps ]; then
      comma=""
    fi
    echo "    \"${dev_dependencies[$i]}\": \"^$(generate_random_version)\"$comma"
  done
  echo "  }"
  echo "}"
}

# Generate root package.json
generate_package_json "root" true > generated/package.json

# Generate app packages
for i in {1..10}; do
  app_name="app-$(generate_random_name)"
  mkdir -p "generated/apps/$app_name"
  generate_package_json "$app_name" false > "generated/apps/$app_name/package.json"
done

# Generate library packages
for i in {1..25}; do
  pkg_name="pkg-$(generate_random_name)"
  mkdir -p "generated/packages/$pkg_name"
  generate_package_json "$pkg_name" false > "generated/packages/$pkg_name/package.json"
done

echo "Generated monorepo structure in ./generated/"