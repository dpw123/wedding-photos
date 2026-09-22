class MasonryLayout {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            return;
        }

        this.options = {
            gap: options.gap || 16,
            minColumnWidth: options.minColumnWidth || 280,
            ...options
        };

        this.resizeEventDispatched = false; // Add flag to track resize event dispatch

        this.init();
    }

    init() {
        this.container.style.position = 'relative';
        this.items = Array.from(this.container.querySelectorAll('.masonry-item')).map(element => {
            const link = element.querySelector('a');
            const width = parseInt(link.dataset.pswpWidth, 10);
            const height = parseInt(link.dataset.pswpHeight, 10);
            const aspectRatio = width / height;

            // Set initial aspect ratio
            const content = element.querySelector('.masonry-item-content');
            content.style.paddingBottom = `${(height / width) * 100}%`;
            content.style.maxHeight = `${(height / width) * 100}%`;

            // Handle image load
            const img = element.querySelector('img');
            if (img.complete) {
                this.handleImageLoad(img, element);
            } else {
                img.onload = () => this.handleImageLoad(img, element);
            }

            return { element, aspectRatio };
        });

        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        this.layout();
    }

    handleImageLoad(img, element) {
        img.classList.add('loaded');
        const placeholder = element.querySelector('.placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        element.querySelector('.masonry-item-content').style.paddingBottom = '';
    }

    calculateColumns() {
        const containerWidth = this.container.offsetWidth;
        if (!containerWidth || !this.items || this.items.length === 0) {
            return { count: 1, width: containerWidth || 300, horizontalOffset: 0, totalGridWidth: containerWidth || 300 };
        }

        const gap = this.options.gap;
        const minColWidth = this.options.minColumnWidth;

        // Number of columns that can physically fit
        const maxColumns = Math.max(1, Math.floor((containerWidth + gap) / (minColWidth + gap)));
        // Constrain column count by number of items so empty columns are not allocated on the right
        const columnCount = Math.min(maxColumns, this.items.length);

        let columnWidth;
        if (this.items.length < maxColumns) {
            // When fewer items than max columns:
            // Calculate base column width as if the grid was full
            const baseColWidth = (containerWidth - (gap * (maxColumns - 1))) / maxColumns;
            if (this.items.length === 1) {
                // For a single photo, keep it comfortably prominent without blowing up full-width
                columnWidth = Math.min(containerWidth, Math.max(baseColWidth, Math.min(480, containerWidth)));
            } else {
                // For 2 items on a 3+ column layout, give them a pleasing width
                const idealTwoColWidth = (containerWidth - gap) / 2;
                columnWidth = Math.min(Math.max(baseColWidth, 420), idealTwoColWidth);
            }
        } else {
            columnWidth = (containerWidth - (gap * (columnCount - 1))) / columnCount;
        }

        const totalGridWidth = (columnCount * columnWidth) + (gap * (columnCount - 1));
        const horizontalOffset = Math.max(0, Math.floor((containerWidth - totalGridWidth) / 2));

        return { count: columnCount, width: columnWidth, horizontalOffset, totalGridWidth };
    }

    layout(isResizeEvent = false) {
        if (!this.container || !this.items || this.items.length === 0) return;

        const { count: columnCount, width: columnWidth, horizontalOffset } = this.calculateColumns();
        const columns = Array(columnCount).fill().map(() => ({
            height: 0,
            items: []
        }));

        this.items.forEach((item) => {
            const shortestColumn = columns.reduce((minCol, col, index) => 
                col.height < columns[minCol].height ? index : minCol
            , 0);

            const itemHeight = columnWidth / item.aspectRatio;
            columns[shortestColumn].items.push({
                element: item.element,
                height: itemHeight
            });
            columns[shortestColumn].height += itemHeight + this.options.gap;
        });

        columns.forEach((column, columnIndex) => {
            let yOffset = 0;
            column.items.forEach((item) => {
                const xOffset = horizontalOffset + (columnIndex * (columnWidth + this.options.gap));
                item.element.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
                item.element.style.width = `${columnWidth}px`;
                item.element.classList.add('after-layout');
                yOffset += item.height + this.options.gap;
            });
        });

        const hasItems = columns.some(col => col.items.length > 0);
        const maxHeight = hasItems ? (Math.max(...columns.map(col => col.height)) - this.options.gap) : 0;
        this.container.style.height = `${Math.max(0, maxHeight)}px`;

        // Dispatch resize event only if not already dispatched
        if (!this.resizeEventDispatched) {
            window.dispatchEvent(new Event('resize'));
            this.resizeEventDispatched = true;

            // Reset flag after 100ms
            setTimeout(() => {
                this.resizeEventDispatched = false;
            }, 100);
        }
    }

    handleResize() {
        requestAnimationFrame(() => this.layout(true));
    }

    // Optional: Method to manually trigger layout with resize event
    refresh() {
        this.layout(false);
    }

    // Optional: Cleanup method
    destroy() {
        window.removeEventListener('resize', this.handleResize);
    }
}

// Initialize the masonry layout
const masonry = new MasonryLayout('#masonry-container', {
    gap: 16,
    minColumnWidth: 280
});

// Fix images overlapping incorrectly for mobile devices (specifically iOS Safari)
const container = document.querySelector("#masonry-container");
if (container && typeof imagesLoaded === 'function') {
    imagesLoaded(container).on('progress', function(){
        if (masonry !== null)
            masonry.layout();
    });
}
