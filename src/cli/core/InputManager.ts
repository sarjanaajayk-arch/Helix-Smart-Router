import { Page } from "../types/AppState";
import { NavigationManager } from "./NavigationManager";

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