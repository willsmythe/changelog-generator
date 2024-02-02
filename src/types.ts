
export interface Issue {
    title: string,
    number: number,
    closedAt: Date,
    url: string,
    milestone: {
        title: string
    },
    labels: Array<{
        name: string,
        url: string
    }>
}
