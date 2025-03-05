// PRISMA TO SUPABASE QUERY CONVERSION EXAMPLES

// =============================================
// EXAMPLE 1: Simple findMany with filtering
// =============================================

// Prisma version
const prismaSample1 = `
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: searchTerm,
    },
    isActive: true,
  },
  select: {
    id: true,
    name: true,
    email: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 10,
  skip: (page - 1) * 10,
});
`;

// Supabase version
const supapaseSample1 = `
const { data: users, error } = await supabase
  .from('users')
  .select('id, name, email')
  .ilike('email', \`%\${searchTerm}%\`)
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .range((page - 1) * 10, page * 10 - 1);

if (error) {
  console.error('Error fetching users:', error);
  return [];
}
`;

// =============================================
// EXAMPLE 2: Relations/Joins
// =============================================

// Prisma version
const prismaSample2 = `
const posts = await prisma.post.findMany({
  where: {
    author: {
      id: userId,
    },
  },
  include: {
    author: {
      select: {
        name: true,
        email: true,
      }
    },
    comments: true,
    categories: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
});
`;

// Supabase version
const supapaseSample2 = `
const { data: posts, error } = await supabase
  .from('posts')
  .select(\`
    id, 
    title, 
    content, 
    created_at,
    author:users(name, email),
    comments(*),
    categories(*)
  \`)
  .eq('author_id', userId)
  .order('created_at', { ascending: false });

if (error) {
  console.error('Error fetching posts:', error);
  return [];
}
`;

// =============================================
// EXAMPLE 3: Creating records
// =============================================

// Prisma version
const prismaSample3 = `
const newUser = await prisma.user.create({
  data: {
    name: userData.name,
    email: userData.email,
    posts: {
      create: [
        { title: 'My first post', content: 'Hello world!' },
      ],
    },
  },
  include: {
    posts: true,
  },
});
`;

// Supabase version
const supapaseSample3 = `
// First create the user
const { data: newUser, error: userError } = await supabase
  .from('users')
  .insert({
    name: userData.name,
    email: userData.email,
  })
  .select();

if (userError) {
  console.error('Error creating user:', userError);
  return null;
}

// Then create the associated posts
const { data: posts, error: postsError } = await supabase
  .from('posts')
  .insert({
    title: 'My first post', 
    content: 'Hello world!',
    author_id: newUser[0].id
  })
  .select();

if (postsError) {
  console.error('Error creating posts:', postsError);
}

// If you need the combined result
const result = {
  ...newUser[0],
  posts: posts || []
};
`;

// =============================================
// EXAMPLE 4: Updating records
// =============================================

// Prisma version
const prismaSample4 = `
const updatedUser = await prisma.user.update({
  where: {
    id: userId,
  },
  data: {
    name: newName,
    posts: {
      updateMany: {
        where: {
          published: false,
        },
        data: {
          published: true,
        },
      },
    },
  },
});
`;

// Supabase version
const supapaseSample4 = `
// Update the user
const { data: updatedUser, error: userError } = await supabase
  .from('users')
  .update({ name: newName })
  .eq('id', userId)
  .select();

if (userError) {
  console.error('Error updating user:', userError);
  return null;
}

// Update the posts in a separate query
const { error: postsError } = await supabase
  .from('posts')
  .update({ published: true })
  .eq('author_id', userId)
  .eq('published', false);

if (postsError) {
  console.error('Error updating posts:', postsError);
}
`;

// =============================================
// EXAMPLE 5: Transactions
// =============================================

// Prisma version
const prismaSample5 = `
const result = await prisma.$transaction(async (tx) => {
  // Delete the user's posts
  const deletedPosts = await tx.post.deleteMany({
    where: { authorId: userId },
  });
  
  // Delete the user
  const deletedUser = await tx.user.delete({
    where: { id: userId },
  });
  
  return {
    deletedPosts,
    deletedUser,
  };
});
`;

// Supabase version
const supapaseSample5 = `
// Supabase doesn't have built-in transactions in the JS client
// For simple cases, you can use foreign key constraints with cascading deletes
// For complex cases, you can create a PostgreSQL function that runs in a transaction

// Example of a PostgreSQL function (create this in Supabase SQL editor):
/*
CREATE OR REPLACE FUNCTION delete_user_with_posts(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_posts_count INTEGER;
  deleted_user JSONB;
BEGIN
  -- Delete posts
  WITH deleted AS (
    DELETE FROM posts WHERE author_id = user_id RETURNING *
  )
  SELECT COUNT(*) INTO deleted_posts_count FROM deleted;
  
  -- Delete user and save result
  WITH deleted AS (
    DELETE FROM users WHERE id = user_id RETURNING *
  )
  SELECT jsonb_agg(row_to_json(deleted)) INTO deleted_user FROM deleted;
  
  -- Return results
  RETURN jsonb_build_object(
    'deleted_posts_count', deleted_posts_count,
    'deleted_user', deleted_user
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;
*/

// Then call it from your JS code:
const { data, error } = await supabase
  .rpc('delete_user_with_posts', { user_id: userId });

if (error) {
  console.error('Error deleting user with posts:', error);
  return null;
}
`;

// =============================================
// EXAMPLE 6: Aggregations
// =============================================

// Prisma version
const prismaSample6 = `
const stats = await prisma.post.aggregate({
  _count: {
    _all: true,
  },
  _avg: {
    views: true,
  },
  _sum: {
    likes: true,
  },
  where: {
    authorId: userId,
    published: true,
  },
});
`;

// Supabase version
const supapaseSample6 = `
// For simple count
const { count, error: countError } = await supabase
  .from('posts')
  .select('*', { count: 'exact', head: true })
  .eq('author_id', userId)
  .eq('published', true);

if (countError) {
  console.error('Error counting posts:', countError);
}

// For more complex aggregations, use PostgreSQL functions
// Example: create a function in Supabase SQL editor
/*
CREATE OR REPLACE FUNCTION get_post_stats(user_id UUID)
RETURNS JSONB
LANGUAGE sql
AS $$
  SELECT 
    jsonb_build_object(
      'count', COUNT(*),
      'avg_views', AVG(views),
      'sum_likes', SUM(likes)
    )
  FROM posts
  WHERE author_id = user_id AND published = true;
$$;
*/

// Then call it from your JS code:
const { data: stats, error } = await supabase
  .rpc('get_post_stats', { user_id: userId });

if (error) {
  console.error('Error getting post stats:', error);
  return null;
}
`;

// Add more examples as needed