import { Controller, Get, Param, Res } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import type { Response } from 'express'
import { PagesService } from './pages.service'

/* Browsers always revalidate; a CDN in front may hold a page for five
   minutes — the same window the in-memory cache uses. */
const HTML_CACHE = 'public, max-age=0, s-maxage=300, stale-while-revalidate=600'

/** The website itself. Outside the /api prefix; the throttler ceiling is for the API, not page views. */
@SkipThrottle()
@Controller()
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  private send(res: Response, r: { status: number; html: string }) {
    res.status(r.status).type('html').setHeader('Cache-Control', r.status === 200 ? HTML_CACHE : 'no-store')
    res.send(r.html)
  }

  @Get('/')
  async home(@Res() res: Response) {
    this.send(res, await this.pages.render('index'))
  }

  @Get('about')
  async about(@Res() res: Response) {
    this.send(res, await this.pages.render('about'))
  }

  @Get('services')
  async services(@Res() res: Response) {
    this.send(res, await this.pages.render('services'))
  }

  @Get('projects')
  async projects(@Res() res: Response) {
    this.send(res, await this.pages.render('projects'))
  }

  @Get('projects/:slug')
  async project(@Param('slug') slug: string, @Res() res: Response) {
    this.send(res, await this.pages.renderProject(slug))
  }

  @Get('contact')
  async contact(@Res() res: Response) {
    this.send(res, await this.pages.render('contact'))
  }

  @Get('sitemap.xml')
  async sitemap(@Res() res: Response) {
    res.type('application/xml').setHeader('Cache-Control', HTML_CACHE)
    res.send(await this.pages.sitemap())
  }

  /** The build's own file names must not bypass injection: /about.html → /about. */
  @Get(':page.html')
  legacyHtml(@Param('page') page: string, @Res() res: Response) {
    res.redirect(301, page === 'index' ? '/' : `/${page}`)
  }
}
