var _ = require('lodash');
const User = require('../models/user')

//Dummy function
const dummy = (blogs) => {
    return 1
  }


//Total likes
const totalLikes = (blogs) => {
    return blogs.reduce((sum, blog) => sum + blog.likes, 0);
    //sum is a var and blog is an object
};

//favorite blog
const favoriteBlog = (blogs) => {
    return blogs.reduce((mostLiked, blog) => {
      return (blog.likes > mostLiked.likes) ? blog : mostLiked;
    }, { title: '', author: '', likes: 0 }); // Initialize with empty strings and 0
}
  

//Most blog
const mostBlog = (blogs) => {
    // Group blogs by author
    const groupedBlogs = _.groupBy(blogs, 'author');

    // Count blogs for each author
    const blogCounts = _.mapValues(groupedBlogs, (blogs) => blogs.length); //blogs.length itterate through the blogs array length

    // Find the author with the most blogs
    const mostBlogsAuthor = _.maxBy(Object.entries(blogCounts), ([author, count]) => count);

    const result = {
        author: mostBlogsAuthor[0],
        blogs: mostBlogsAuthor[1]
    };

    return result
}

const mostLiked = (blogs) => {
    // Group blogs by author
    const groupedBlogs = _.groupBy(blogs, 'author');

    // Count total likes for each author
    const likesCounts = _.mapValues(groupedBlogs, (blogs) =>
        _.sumBy(blogs, 'likes')
    );

    // Find the author with the most likes
    const mostBlogsLikesAuthor = _.maxBy(Object.entries(likesCounts), ([author, likes]) => likes);

    // Construct the result object
    const result = {
        author: mostBlogsLikesAuthor[0],
        likes: mostBlogsLikesAuthor[1]
    };

    return result;
};

const usersInDb = async () => {
    const users = await User.find({})
    return users.map(u => u.toJSON())
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlog,
    mostLiked,
    usersInDb
}

