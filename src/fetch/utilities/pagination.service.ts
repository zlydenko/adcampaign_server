import { EventName } from "../dto";

export class PaginationService {
  private readonly paginationQueue = new Set<{ url: string; eventName: EventName }>();
  private static readonly PAGINATION_DELAY = 1000; //? 1 second between requests

  addToQueue(url: string, eventName: EventName): void {
    this.paginationQueue.add({ url, eventName });
  }

  getNextItem(): { url: string; eventName: EventName } | undefined {
    const item = this.paginationQueue.values().next().value;
    if (item) {
      this.paginationQueue.delete(item);
    }
    return item;
  }

  hasItems(): boolean {
    return this.paginationQueue.size > 0;
  }

  async delay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, PaginationService.PAGINATION_DELAY));
  }
}