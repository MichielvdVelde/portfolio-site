# Portfolio site

Contains the code for the portfolio site I'm actively developing. Feel free to browse, I don't know how much it helps you. It's licensed under MIT, should you care.

I extracted [github-api-simple](https://github.com/MichielvdVelde/github-api-simple) from this code, which now lives on its own.

## Routes

* `/` - Home page
  * Latest blog posts
  * Latest projects
* `/projects` - Project site
  * List all projects (GitHub & npm)
* `/projects/{project}`
  * List project info
    * Name
	* Description
	* Latest update & most recent commit (GitHub)
	* npm download count
	* Project readme
