const endpoints = [
    {
        local_address: ["192.168.10.5", 6881],
        info_hashes: [
            {
                message: "",
                last_error: {
                    value: 0,
                    category: "system",
                },
                next_announce: 1752937653,
                min_announce: 1752937653,
                scrape_incomplete: -1,
                scrape_complete: -1,
                scrape_downloaded: -1,
                fails: 0,
                updating: false,
                start_sent: false,
                complete_sent: false,
            },
            {
                message: "",
                last_error: {
                    value: 0,
                    category: "system",
                },
                next_announce: 1752937653,
                min_announce: 1752937653,
                scrape_incomplete: -1,
                scrape_complete: -1,
                scrape_downloaded: -1,
                fails: 0,
                updating: false,
                start_sent: false,
                complete_sent: false,
            },
        ],
        message: "",
        last_error: {
            value: 0,
            category: "system",
        },
        next_announce: 1752937653,
        min_announce: 1752937653,
        scrape_incomplete: -1,
        scrape_complete: -1,
        scrape_downloaded: -1,
        fails: 0,
        updating: false,
        start_sent: false,
        complete_sent: false,
    },
    {
        local_address: ["127.0.0.1", 6881],
        info_hashes: [
            {
                message: "",
                last_error: {
                    value: 11001,
                    category: "system",
                },
                next_announce: 1752945857,
                min_announce: 1752944052,
                scrape_incomplete: -1,
                scrape_complete: -1,
                scrape_downloaded: -1,
                fails: 0,
                updating: false,
                start_sent: false,
                complete_sent: false,
            },
            {
                message: "",
                last_error: {
                    value: 0,
                    category: "system",
                },
                next_announce: 1752937653,
                min_announce: 1752937653,
                scrape_incomplete: -1,
                scrape_complete: -1,
                scrape_downloaded: -1,
                fails: 0,
                updating: false,
                start_sent: false,
                complete_sent: false,
            },
        ],
        message: "",
        last_error: {
            value: 11001,
            category: "system",
        },
        next_announce: 1752945857,
        min_announce: 1752944052,
        scrape_incomplete: -1,
        scrape_complete: -1,
        scrape_downloaded: -1,
        fails: 0,
        updating: false,
        start_sent: false,
        complete_sent: false,
    },
];

const isOkay = endpoints.every((endpoint) => {
    return (
        endpoint.fails <= 0 &&
        endpoint.info_hashes.every((infoHash) => {
            return infoHash.fails <= 0;
        })
    );
});
console.log(isOkay);
