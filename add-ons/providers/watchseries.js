const URL = {
    DOMAIN: `http://watchseries.sk`,
    SEARCH: (title, season, episode) => {
        return `http://watchseries.sk/series/${title}/season/${season}/episode/${episode}`;
    }
};

class WatchSeries {
    constructor(props) {
        this.libs       = props.libs;
        this.movieInfo  = props.movieInfo;
        this.settings   = props.settings;
        this.state      = {};
    }

    async searchDetail() {

        const { httpRequest, cheerio, stringHelper, base64 } = this.libs; 
        let { title, year, season, episode, type } = this.movieInfo;

        let urlSearch           = URL.SEARCH(stringHelper.convertToSearchQueryString(title), season, episode);

        this.state.detailUrl    = urlSearch;
        return;
    }


    async getHostFromDetail() {

        const { httpRequest, cheerio, base64 } = this.libs;
        if(!this.state.detailUrl) throw new Error("NOT_FOUND");

        let hosts       = [];
        let arrRedirect = [];

        let detailUrl   = this.state.detailUrl;

        let htmlSearch  = await httpRequest.getHTML(this.state.detailUrl);
        let $           = cheerio.load(htmlSearch);

        let itemRedirect= $('#table_id tbody tr');

        itemRedirect.each(function() {

            let linkRedirect = $(this).find('.view_link a').attr('href');
            arrRedirect.push(linkRedirect);
        });

        let arrPromise = arrRedirect.map(async function(val) {

            try {
                let htmlRedirect    = await httpRequest.getHTML(val);
                let $_2             = cheerio.load(htmlRedirect);
    
                let linkEmbed       = $_2('.main-inner .vc_row .wrap a').attr('href');
    
                linkEmbed && hosts.push({
                    provider: {
                        url: detailUrl,
                        name: "watchseries"
                    },
                    result: {
                        file: linkEmbed,
                        label: "embed",
                        type: "embed"
                    }
                });
            } catch(error) {}

        });

        await Promise.all(arrPromise);

        this.state.hosts = hosts;
        return;
    }

}

exports.default = async (libs, movieInfo, settings) => {

    const series = new WatchSeries({
        libs: libs,
        movieInfo: movieInfo,
        settings: settings
    });
    await series.searchDetail();
    await series.getHostFromDetail();
    return series.state.hosts;
}


exports.testing = WatchSeries;