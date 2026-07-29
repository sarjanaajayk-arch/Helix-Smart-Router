import { Page } from "../types/AppState";

export class NavigationManager {
    private readonly pages: Page[] = [
        Page.Dashboard,
        Page.Providers,
        Page.Models,
        Page.Routes,
        Page.Status,
        Page.Config,
    ];

    public next(current: Page): Page {
        const index = this.pages.indexOf(current);
        return this.pages[(index + 1) % this.pages.length];
    }

    public previous(current: Page): Page {
        const index = this.pages.indexOf(current);
        return this.pages[
            (index - 1 + this.pages.length) % this.pages.length
        ];
    }

    public getPages(): Page[] {
        return [...this.pages];
    }
}