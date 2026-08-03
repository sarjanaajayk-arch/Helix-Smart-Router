import { Page } from "../types/AppState.js";
import { NavigationManager } from "./NavigationManager.js";

export class InputManager {
    constructor(
        private readonly navigation: NavigationManager
    ) {}

    public handleNavigation(
        currentPage: Page,
        direction: "next" | "previous"
    ): Page {
        if (direction === "next") {
            return this.navigation.next(currentPage);
        }

        return this.navigation.previous(currentPage);
    }
}