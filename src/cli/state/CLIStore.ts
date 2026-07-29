import { Page } from "../types/AppState";

export interface CLIState {
    currentPage: Page;
    focus: "navigation" | "content";
    loading: boolean;
    selectedProviderIndex: number;
    selectedModelIndex: number;
    selectedRouteIndex: number;
    searchQuery: string;
}

export class CLIStore {
    private state: CLIState = {
        currentPage: Page.Dashboard,
        focus: "navigation",
        loading: false,
        selectedProviderIndex: 0,
        selectedModelIndex: 0,
        selectedRouteIndex: 0,
        searchQuery: "",
    };

    public getState(): CLIState {
        return { ...this.state };
    }

    public setCurrentPage(page: Page): void {
        this.state.currentPage = page;
    }

    public setFocus(focus: "navigation" | "content"): void {
        this.state.focus = focus;
    }

    public setLoading(loading: boolean): void {
        this.state.loading = loading;
    }

    public setSelectedProviderIndex(index: number): void {
        this.state.selectedProviderIndex = index;
    }

    public setSelectedModelIndex(index: number): void {
        this.state.selectedModelIndex = index;
    }

    public setSelectedRouteIndex(index: number): void {
        this.state.selectedRouteIndex = index;
    }

    public setSearchQuery(query: string): void {
        this.state.searchQuery = query;
    }
}