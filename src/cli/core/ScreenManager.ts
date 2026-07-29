import { Page } from "../types/AppState";
import { NavigationManager } from "./NavigationManager";

export class ScreenManager {
    constructor(
        private readonly navigation: NavigationManager
    ) {}

    public next(current: Page): Page {
        return this.navigation.next(current);
    }

    public previous(current: Page): Page {
        return this.navigation.previous(current);
    }

    public getPages(): Page[] {
        return this.navigation.getPages();
    }
}