# How to update your website yourself

A step-by-step guide to keeping https://yokytreera.github.io up to date: adding
projects, editing your About page, writing blog posts, updating your CV, and
publishing. The second half covers Git and GitHub, and how to make GitHub work
for your career.

You don't need to remember all of this. Keep this file open, follow the recipe
you need, and copy the commands.

---

## Contents

1. [How the pieces fit together](#1-how-the-pieces-fit-together)
2. [Your everyday routine](#2-your-everyday-routine)
3. [Recipe: add a new project](#3-recipe-add-a-new-project)
4. [Recipe: update your About page](#4-recipe-update-your-about-page)
5. [Recipe: write a blog post](#5-recipe-write-a-blog-post)
6. [Recipe: add a publication](#6-recipe-add-a-publication)
7. [Recipe: update your CV](#7-recipe-update-your-cv)
8. [Publishing, step by step](#8-publishing-step-by-step)
9. [Privacy checklist](#9-privacy-checklist)
10. [Git and GitHub: the basics](#10-git-and-github-the-basics)
11. [Undoing mistakes](#11-undoing-mistakes)
12. [When something goes wrong](#12-when-something-goes-wrong)
13. [Sharing your site](#13-sharing-your-site)
14. [Getting the most out of GitHub](#14-getting-the-most-out-of-github)

---

## 1. How the pieces fit together

There are three copies of your website, and changes move in one direction:

```
 Your Mac                      GitHub (main branch)           GitHub Pages (gh-pages branch)
 ─────────────                 ────────────────────           ──────────────────────────────
 .qmd files you edit   ──push──▶  a backup of your     ──publish──▶  the finished website
 (this folder)                    source files                       people actually see
```

- **Your Mac** is where you write. Nothing you do here is public until you push
  or publish.
- **`main` on GitHub** is the backup and history of your source files. Anyone
  can read it, because the repository is public.
- **`gh-pages` on GitHub** holds the built website. `quarto publish` fills it.
  It goes live at https://yokytreera.github.io about a minute later.

Two words you'll meet a lot:

- **Quarto** turns your `.qmd` text files into web pages.
- **Git** keeps a history of every change, and **GitHub** stores that history
  online.

### What lives where

| Folder or file | What it is |
|---|---|
| `index.qmd` | Home page |
| `about.qmd` | About page (English) |
| `th/about.qmd` | About page (Thai), the only Thai page |
| `projects/<name>/index.qmd` | One folder per project |
| `blog/<name>/index.qmd` | One folder per blog post |
| `publications.qmd` | Publications list |
| `files/Yoky-Treerasoradaj-CV.pdf` | The CV people download |
| `images/` | Your photo, the CHIA badge, the SDG icons |
| `_quarto.yml` | Site settings: menu bar, footer, theme |
| `styles/` | Colours and layout |
| `_notes/` | **Private.** Your notes, original photos and source files. Never published, never pushed to GitHub. |
| `_site/` | The built website. Quarto rewrites it every time, so never edit it. |

**The underscore rule:** any file or folder whose name starts with `_` is never
turned into a web page. That's why `_notes/` is safe.

---

## 2. Your everyday routine

1. Open **RStudio** by double-clicking `website.Rproj`.
2. Click the **Terminal** tab in the bottom panel and run:

   ```bash
   quarto preview
   ```

   Your site opens in a browser at a `localhost` address. Only you can see it.
3. Edit a file and save it. The browser refreshes by itself.
4. When you're done, stop the preview with **Ctrl + C** in the Terminal.
5. Publish (section 8).

---

## 3. Recipe: add a new project

### Step 1: make the folder

The quickest way is to copy an existing project and change it. In the
Terminal:

```bash
cp -R projects/rpa-vaccination projects/my-new-project
```

Folder names: lowercase, words joined by dashes, no spaces
(`flu-forecast`, `diabetes-risk-model`). The folder name becomes the web
address: `yokytreera.github.io/projects/flu-forecast/`.

Then delete the old images in the new folder, and the old text in its
`index.qmd`.

### Step 2: fill in the header

The block between the two `---` lines at the top of `index.qmd` controls the
project card on the Projects page:

```yaml
---
title: "Forecasting Flu Admissions for Bangkok Hospitals"
subtitle: "One sentence that explains what the project is"
description: "Two sentences that appear on the card: what you did and what changed because of it."
years: "2026"             # label shown above the title on the card, e.g. "2025 – 2026"
date: 2026-03-01          # when the project started: sorts the cards, newest first
image: cover.jpg          # card picture, in this folder; delete the line for no picture
categories: [Forecasting, Machine learning, R]
toc: true                 # shows "On this page" on the right
---
```

About `categories`:

- They become the filter tags on the Projects page.
- Reuse existing ones where you can: `Machine learning`, `Forecasting`, `R`,
  `Python`, `Preventive medicine`, `Decision support`, `Public health`,
  `BI dashboards`, `Project management`, `Collaboration`, `LEAN`, `RPA`,
  `Vaccination`, `Leadership`, `Health communication`.
- Spelling and capitals must match exactly. The skill tags on your About page
  link to these.

### Step 3: write the page

Plain Markdown works everywhere:

```markdown
## The problem

Short paragraphs. Say what was wrong, for whom, and why it mattered.

## What I did

- A bullet point
- **Bold** for the key result

![Caption under the picture.](images/01-dashboard.png){fig-alt="What the picture shows, for screen readers"}
```

A structure that reads well: **problem, what you did, results (with numbers),
what you learned, what's next.**

The site also has some ready-made design blocks. Copy them from an existing
project page:

| Block | What it looks like | Copy it from |
|---|---|---|
| `::: {.fact-grid}` | Grey boxes with key facts at the top | any project |
| `::: {.impact-band}` | Large numbers in a row | `tb-tracking-dss` |
| `::: {.pipeline}` | Numbered steps | `health-check-campaign` |
| `::: {.case-grid}` | Two or three side-by-side cards | `health-check-campaign` |
| `::: {.photo-grid}` | Photos in a two-column grid | `eamsc-white-paper` |
| `<video>` | A video player | `eamsc-white-paper` |

The `:::` lines have to come in pairs (open and close), just like brackets.

### Step 4: pictures

1. Put pictures in an `images/` folder inside the project folder.
2. Name them simply: `01-team.jpg`, `02-dashboard.png`.
3. Put the original photo (straight from the phone) in
   `_notes/sources/<project-name>/`, not in the project folder.
4. **Blur faces** of patients and members of the public before adding a photo.
5. The cover picture for the card is `cover.jpg` in the project folder. A
   landscape picture about 1200 × 800 pixels works best.

The checker in section 8 removes hidden GPS data from photos for you.

### Step 5: link it from your About page

Find the right year in `about.qmd` and add a link:

```markdown
- **2026:** built a [flu admissions forecast](projects/flu-forecast/index.qmd) for ...
```

Add the same line in Thai to `th/about.qmd`. Note the `../` at the front,
because the Thai page sits one folder down:

```markdown
- **2026:** สร้างโมเดลพยากรณ์ ... [ดูผลงาน](../projects/flu-forecast/index.qmd)
```

### Step 6: preview, check, publish

Check the Projects page in the preview: the card, its year label, its place in
the order, and the filter tags. Then publish (section 8).

**To remove a project:** delete its folder, then remove any links to it from
`about.qmd`, `th/about.qmd` and `index.qmd`. Quarto warns you about broken links
when it builds.

---

## 4. Recipe: update your About page

`about.qmd` is the English page. `th/about.qmd` is the Thai page, so update
both.

### Add something to your journey

Each stage of your career is a block like this, newest first:

```markdown
::: {.ch}
[2025 – present]{.ch-when}

### Master of Health Data Analytics [· Monash University, Melbourne]{.ch-where}

[Australia for ASEAN Scholarship]{.ch-org}

A short paragraph about this stage.

[Experience]{.ch-label}

- **2026:** something you did, with a [link to the project](projects/x/index.qmd).

::: {.chips}
[Machine learning](projects/index.qmd#category=Machine%20learning){.chip .chip-link}
:::
:::
```

- To add an achievement, add a bullet under `[Experience]{.ch-label}`, newest
  at the top.
- To start a new job, copy a whole block (from `::: {.ch}` to its closing
  `:::`) and paste it at the top, above the current one.
- A skill tag (chip) links to the Projects page filtered by that skill. In the
  link, a space becomes `%20`: `Machine%20learning`. The words must match a
  project category exactly.

### Certifications and awards

Each line is a list item, with the year on the right:

```markdown
- Certified Health Informatician Australasia (CHIA), AIDH [2026]{.yr}
```

Keep them newest first.

### Your style rules (so the page stays consistent)

- Newest first, everywhere.
- Titles as "Role · Organisation".
- Years as ranges: `2022 – 2025`.
- Contact: email and LinkedIn only, **never your phone number**.
- On the Thai page, keep proper nouns in English: Monash University,
  Melbourne VIC, Australia, Vajira Hospital.

---

## 5. Recipe: write a blog post

### Step 1: make the folder

Use the date at the front so posts stay in order in Finder:

```bash
mkdir -p blog/2026-12-what-i-learned-forecasting
```

### Step 2: create `index.qmd` in that folder

```yaml
---
title: "What Forecasting Taught Me About Hospital Beds"
description: "One or two sentences shown in the blog list."
date: 2026-12-01
categories: [Forecasting, Health data]
image: cover.jpg     # optional picture for the list
draft: true          # remove this line when it's ready to publish
---

Your first paragraph. Get to the point in the first two sentences.

## A heading

More text.
```

- **`draft: true`** means you can see the post in `quarto preview`, but it is
  left out of the published site. Delete the line when you're ready.
- Pictures go in the same folder: `![Caption](chart.png)`.
- Delete the placeholder post `blog/welcome/` once you have a real one.

### Step 3 (optional): R code in a post

You can run R code inside a post, and the chart appears on the page:

````markdown
```{r}
#| echo: true
#| fig-cap: "Beer production in Australia"
library(fpp3)
aus_production |> autoplot(Beer)
```
````

- `#| echo: true` shows the code. Use `false` to show only the result.
- Only use public or synthetic data. Never use patient data.
- The site remembers the result (the `_freeze/` folder), so old posts don't
  re-run every time you publish.

### Ideas for posts

- What you learned from a Kaggle competition, and what you'd do differently.
- A plain-language explanation of a paper you co-authored.
- A short tutorial: a forecasting model in R in 10 lines.
- Notes from an event: AIDH, ADAM, a conference.
- A reflection: what a doctor brings to data science.

One post a month is plenty. Short and regular beats long and rare.

---

## 6. Recipe: add a publication

Open `publications.qmd`. Copy a line under the right year and edit it:

```markdown
1. Author A, **Treerasoradaj N**, Author C. [Title of the paper](https://doi.org/10.xxxx/xxxxx). *Journal Name*. 2026;1(2):3–4. [doi:10.xxxx/xxxxx](https://doi.org/10.xxxx/xxxxx){.doi}
```

- Put your own name in `**bold**`.
- Find the DOI on the journal's page. It starts with `10.`
- Add a `## 2027` heading when the new year starts, above `## 2026`.
- Add the paper to your CV as well (section 7) and check Google Scholar has
  picked it up.

---

## 7. Recipe: update your CV

Your CV is made by a Python script that lives next to the website folder (not
inside it, so it's not on GitHub): `files 2/build_cv_e-t.py`.

1. Open `build_cv_e-t.py` in RStudio. All the text is in the `CONTENT` section
   at the top. Edit it there.
   - A plain `"text"` shows in both languages.
   - A pair `("English", "ไทย")` gives a Thai version for the Thai view.
2. In the Terminal, go to that folder and build it:

   ```bash
   cd "/Users/yokeee/Documents/Australia Awards/CV/files 2"
   ```

   ```bash
   python3 build_cv_e-t.py --pdf
   ```

   This writes `cv_e-t.html` and prints the PDF straight into
   `website/files/Yoky-Treerasoradaj-CV.pdf`.
3. Open the PDF and check it:
   - **Two pages.** If it spills onto a third, shorten some text.
   - **No phone number.**
   - The links work (email, LinkedIn, website, DOIs).
4. Go back to the website folder and publish (section 8):

   ```bash
   cd website
   ```

Keep the PDF's file name exactly the same, or the "Download CV" button breaks.

---

## 8. Publishing, step by step

Run these in the RStudio Terminal, inside the `website` folder, one at a time.

**1. Check for anything private.** This also removes GPS data from photos:

```bash
python3 _scripts/check-before-publish.py
```

If it lists warnings, fix them first. Usually that means moving the file into
`_notes/`.

**2. See what changed:**

```bash
git status
```

Read the list. Every file here will become public on GitHub. If you see
something that should be private, stop and move it into `_notes/`.

**3. Save a snapshot (a "commit"):**

```bash
git add -A
```

```bash
git commit -m "Add flu forecasting project"
```

The message says what you changed, in a few words.

**4. Back up the source to GitHub:**

```bash
git push
```

**5. Build the site and put it live:**

```bash
quarto publish gh-pages --no-prompt --no-browser
```

**6. Check it.** Open https://yokytreera.github.io after a minute or two. If
you still see the old version, refresh with **Cmd + Shift + R**, which skips
the browser's saved copy.

Steps 3–4 (the backup) and step 5 (the website) are separate, so do both.

---

## 9. Privacy checklist

Your repository is public, so treat everything outside `_notes/` as if it
were on a billboard.

Before every publish:

- [ ] Ran `python3 _scripts/check-before-publish.py`, and it says "All clear".
- [ ] Read through `git status`, and nothing on it surprised me.
- [ ] No patient names, HN, phone numbers, ID numbers or addresses. Only
      totals, like "1,978 people screened".
- [ ] No maps of where patients live.
- [ ] Faces of patients and the public are blurred.
- [ ] Raw data (CSV, Excel), slides, Word files and zips are in `_notes/`.
- [ ] No passwords, API keys or tokens anywhere. If you ever push one by
      mistake, **change the password or key straight away.** Deleting the file
      afterwards isn't enough, because Git keeps the history.

### Two safety nets already in place

- **`.gitignore`** tells Git never to upload `_notes/`, `_site/`, `.DS_Store`,
  zip files and R history files.
- **`_scripts/clean-site.py`** runs after every build. It deletes private file
  types from the built site and strips GPS data from its photos.

They are safety nets, not a replacement for looking.

---

## 10. Git and GitHub: the basics

### Words you'll see

| Word | What it means |
|---|---|
| **Repository (repo)** | A project folder whose history Git tracks. Yours is `yokytreera/yokytreera.github.io`. |
| **Commit** | A saved snapshot of your files, with a message. Like "Save as", but it keeps every version. |
| **Push** | Upload your new commits to GitHub. |
| **Pull** | Download commits from GitHub, for example if you edited a file on the GitHub website. |
| **Branch** | A separate line of history. You have `main` (source) and `gh-pages` (built site). |
| **Clone** | Download a whole repository to a computer. Useful if you get a new laptop. |

### Commands you'll actually use

```bash
git status                 # what has changed since the last commit?
git diff                   # show the exact lines that changed
git add -A                 # include every change in the next commit
git commit -m "message"    # save the snapshot
git push                   # upload to GitHub
git pull                   # download changes made elsewhere
git log --oneline          # list of past commits, newest first
```

### Writing good commit messages

Start with a verb and say what changed:

- ✅ `Add TB VFind award photo`
- ✅ `Update CV with 2026 publications`
- ❌ `update`
- ❌ `stuff`

Commit often. Small commits are easier to undo.

### Seeing your history on GitHub

Go to https://github.com/yokytreera/yokytreera.github.io and click
**Commits**. You can open any commit to see exactly what changed, line by line.
This history is your safety net: nothing you commit is ever truly lost.

### Working from another computer

```bash
git clone https://github.com/yokytreera/yokytreera.github.io.git
```

This gets you the source files only. Your `_notes/` folder is never on
GitHub, so back it up separately (for example to an external drive or Google
Drive).

---

## 11. Undoing mistakes

| Situation | What to do |
|---|---|
| I edited a file and want the last saved version back (not committed yet) | `git restore about.qmd` |
| I want to throw away **all** changes since my last commit | `git restore .` (careful: this can't be undone) |
| I ran `git add` on a file by mistake | `git restore --staged thatfile.pdf` |
| I committed but haven't pushed, and want to change the message | `git commit --amend -m "Better message"` |
| I pushed a bad change and want to undo it | `git log --oneline` to find the commit's code (like `a1b2c3d`), then `git revert a1b2c3d`, then `git push` and publish again |
| The live website is broken | Undo the change as above, then run `quarto publish gh-pages --no-prompt --no-browser` again. The previous version is back within minutes. |
| I pushed something private | Remove it, commit, push and publish. Then ask for help cleaning the history, and change any password or key that was exposed. |

`git revert` is the safe kind of undo. It adds a new commit that cancels the
old one, so the history stays intact.

---

## 12. When something goes wrong

| Problem | Fix |
|---|---|
| The preview shows "Quarto Render Error" | Read the error in the Terminal: it names the file and line. It's usually a `:::` without its partner, or a typo in the `---` header. |
| My change doesn't show in the preview | Save the file again, or stop the preview (Ctrl + C) and start it again. |
| `quarto publish` says it can't push | Run `gh auth status`. If you're logged out, run `gh auth login` again. |
| `git push` is "rejected" | Someone (probably you, on the GitHub website) changed something. Run `git pull`, then `git push`. |
| The live site looks old | Wait two minutes, then refresh with Cmd + Shift + R. |
| A project card is in the wrong order | Check its `date:` in the header. Cards sort by date, newest first. |
| A skill tag shows no projects | The tag's words don't exactly match any project's `categories`. |
| Weird characters in Thai text | Make sure the file is saved as UTF-8 (RStudio: File → Save with Encoding → UTF-8). |

---

## 13. Sharing your site

### LinkedIn

1. **Contact info:** open your profile → the pencil icon next to your name
   → **Contact info** → **Add website**. Paste `https://yokytreera.github.io`
   and choose **Portfolio** as the type.
2. **Featured section:** on your profile, **Add profile section** →
   **Recommended** → **Add featured** → **Add a link**.
   - Link 1: `https://yokytreera.github.io`. Title: *Portfolio: health data,
     prevention and machine learning projects*.
   - Link 2: `https://yokytreera.github.io/files/Yoky-Treerasoradaj-CV.pdf`.
     Title: *CV (PDF)*.
   - You can also feature single projects, such as
     `https://yokytreera.github.io/projects/tb-tracking-dss/`.
3. **About section:** end it with one line, for example: *Projects, data work
   and publications: yokytreera.github.io*
4. **When you publish something new** (a project or a blog post), share the
   page's link in a LinkedIn post with two or three sentences on what you
   learned.

### Email signature (Gmail)

Gmail → the gear icon → **See all settings** → **General** → **Signature** →
**Create new**. For example:

```
Yoky Treerasoradaj, MD
Master of Health Data Analytics, Monash University
Certified Health Informatician Australasia (CHIA)
Portfolio: yokytreera.github.io  |  LinkedIn: linkedin.com/in/tnutachat
```

Highlight each address in the signature box and use the link button to make it
clickable. Scroll down and click **Save Changes**.

### Your CV

The CV already links to the website in the header, and has a "See my projects"
button at the end.

---

## 14. Getting the most out of GitHub

For someone in health data, GitHub is more than storage: it's where employers,
supervisors and collaborators look to see how you work.

### 1. Make your profile a front page

- **Profile README:** create a repository named exactly `yokytreera`. Its
  `README.md` shows at the top of https://github.com/yokytreera. Write three or
  four lines: who you are, what you work on, a link to your website.
- **Photo and bio:** use the same photo and one-line headline as LinkedIn, so
  people know it's you.
- **Pin your best repositories** (profile → *Customize your pins*), up to six.

### 2. Share your analysis code

Give each serious project its own repository, for example `icu-mortality-model`
or `electricity-demand-forecast`. A good analysis repository has:

- a `README.md`: the question, the data source, how to run it, the main result
  with a chart;
- clean, commented R or Python scripts or Quarto notebooks;
- a `LICENSE` file (MIT is common for code);
- **public or synthetic data only.** For hospital work, share the code and
  methods, never the data. You can generate fake data with the same shape so
  others can run the code.

This shows exactly what a CV can't: how you think, how clean your code is, and
whether your work can be reproduced.

### 3. Use the student benefits

With your Monash email, apply for the **GitHub Student Developer Pack**
(education.github.com/pack). It includes **GitHub Copilot** (an AI coding
assistant) free while you're a student, plus credits for other tools.

### 4. Make your code citable

Connect a repository to **Zenodo** (zenodo.org) and each **Release** you make
on GitHub gets a DOI. You can then cite your code in papers and list it on
your CV and Google Scholar profile.

### 5. Use GitHub to organise yourself

- **Issues** work as a to-do list for a project: "Add 2027 results", "Fix
  chart colours".
- **Projects** gives you a kanban board, which is useful for a thesis or a
  team assignment.
- **Collaborate:** for group work at Monash, one repository with everyone as a
  collaborator beats emailing files back and forth.

### 6. Join open-source health data work

Reading and contributing to real projects is one of the fastest ways to learn
and get known. Good places to start:

- **tidyverts** (`fable`, `tsibble`): the R forecasting packages behind
  `fpp3`, which you already use.
- **OHDSI**: open tools for observational health research, used worldwide.
- **HL7 FHIR** tools, which link to your FHIR training.

Start small: fix a typo in documentation, or answer a question in an issue.

### 7. A learning path

| When | Try this |
|---|---|
| This month | Make your profile README. Publish one blog post with this guide. |
| Next month | Put one Monash or Kaggle analysis in its own repository with a good README. Pin it. |
| In 3 months | Use Issues to plan a project. Make a Release and connect Zenodo. |
| In 6 months | Make a small contribution to an open-source R or health data project. |
| Later | Learn **GitHub Actions**, which can build and publish the website automatically every time you push. |

### Helpful free resources

- GitHub Skills (skills.github.com): short interactive courses, done inside
  GitHub.
- *Happy Git and GitHub for the useR* (happygitwithr.com): Git explained for R
  users.
- Quarto guide (quarto.org/docs/guide): everything about pages, blogs and
  websites.
