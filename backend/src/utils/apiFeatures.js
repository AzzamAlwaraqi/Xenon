class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }
    filter(){
        const queryObj = {...this.queryString};
        const excludedFields = ['page','sort','limit','fields'];
        excludedFields.forEach(el=>delete queryObj[el]);
        this.query = this.query.find(queryObj);
        return this;
    }
    sort(){
        if(this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        }else{
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }
    limit(){
        if(this.queryString.limit){
            const limit = this.queryString.limit;
            this.query = this.query.limit(limit);
        }
        return this;
    }
    paginate(){
        if(this.queryString.page){
            const page = this.queryString.page;
            const limit = this.queryString.limit;
            const skip = (page-1)*limit;
            this.query = this.query.skip(skip).limit(limit);
        }
        return this;
    }
    fields(){
        if(this.queryString.fields){
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        }
        return this;
    }
}   