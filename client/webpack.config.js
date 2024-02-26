const path = require('path');

module.exports = {
  entry: './src/index.js', // Entry point of your application
  
  output: {
  
    path: path.resolve(__dirname, 'dist'), // Output directory
    filename: 'bundle.js' // Output filename
  },
  resolve: {
  
    fallback: { "buffer": require.resolve("buffer/") } // Fallback for missing modules
  },
  
  module: {
  
    rules: [
      // Rules for processing different file types (e.g., JavaScript, CSS, etc.)
      {
        test: /\.js$/, // Apply this rule to JavaScript files
        exclude: /node_modules/, // Don't apply this rule to files in node_modules
        use: {
          loader: 'babel-loader', // Use babel-loader to transpile JavaScript files
          options: {
            presets: ['@babel/preset-env'] // Use @babel/preset-env for transpilation
          }
        }
      }
    ]
  }
};
