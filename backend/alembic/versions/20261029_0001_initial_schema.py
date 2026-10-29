"""Initial schema: users, profiles, posts, comments, likes, events, rsvps, notices, reads, communities, memberships, notifications

Revision ID: 0001_initial
Revises:
Create Date: 2026-10-29 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=True),
        sa.Column('role', sa.String(50), nullable=False, server_default='student'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 2. student_profiles table
    op.create_table(
        'student_profiles',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('full_name', sa.String(150), nullable=False),
        sa.Column('handle', sa.String(60), nullable=False),
        sa.Column('initials', sa.String(10), nullable=False),
        sa.Column('university', sa.String(255), nullable=False, server_default='National Institute of Technology'),
        sa.Column('department_major', sa.String(255), nullable=False),
        sa.Column('graduation_year', sa.Integer(), nullable=False),
        sa.Column('academic_year_title', sa.String(100), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('skills', sa.JSON(), nullable=False),
        sa.Column('interests', sa.JSON(), nullable=False),
        sa.Column('location', sa.String(255), nullable=True),
        sa.Column('avatar_url', sa.Text(), nullable=True),
        sa.Column('banner_url', sa.Text(), nullable=True),
        sa.Column('banner_gradient', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_student_profiles_user_id', 'student_profiles', ['user_id'], unique=True)
    op.create_index('ix_student_profiles_handle', 'student_profiles', ['handle'], unique=True)

    # 3. posts table
    op.create_table(
        'posts',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('author_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tags', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_posts_author_id', 'posts', ['author_id'])
    op.create_index('ix_posts_created_at', 'posts', ['created_at'])

    # 4. comments table
    op.create_table(
        'comments',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('post_id', sa.String(36), sa.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('author_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_comments_post_id', 'comments', ['post_id'])
    op.create_index('ix_comments_author_id', 'comments', ['author_id'])

    # 5. post_likes table
    op.create_table(
        'post_likes',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('post_id', sa.String(36), sa.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('post_id', 'user_id', name='uq_post_like_user'),
    )
    op.create_index('ix_post_likes_post_id', 'post_likes', ['post_id'])
    op.create_index('ix_post_likes_user_id', 'post_likes', ['user_id'])

    # 6. events table
    op.create_table(
        'events',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('short_description', sa.Text(), nullable=False),
        sa.Column('full_description', sa.Text(), nullable=False),
        sa.Column('event_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('month', sa.String(10), nullable=False),
        sa.Column('day', sa.String(10), nullable=False),
        sa.Column('time_str', sa.String(100), nullable=False),
        sa.Column('location', sa.String(255), nullable=False),
        sa.Column('organizer_name', sa.String(150), nullable=False),
        sa.Column('organizer_role', sa.String(100), nullable=True),
        sa.Column('organizer_initials', sa.String(10), nullable=False),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('capacity', sa.Integer(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=False),
        sa.Column('highlights', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_events_event_date', 'events', ['event_date'])

    # 7. event_rsvps table
    op.create_table(
        'event_rsvps',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('event_id', sa.String(36), sa.ForeignKey('events.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='confirmed'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('event_id', 'user_id', name='uq_event_rsvp_user'),
    )
    op.create_index('ix_event_rsvps_event_id', 'event_rsvps', ['event_id'])
    op.create_index('ix_event_rsvps_user_id', 'event_rsvps', ['user_id'])

    # 8. notices table
    op.create_table(
        'notices',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('short_description', sa.Text(), nullable=False),
        sa.Column('full_description', sa.Text(), nullable=False),
        sa.Column('department', sa.String(150), nullable=False),
        sa.Column('reference_number', sa.String(100), nullable=True),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_important', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('published_date', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('expiry_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('attachment_name', sa.String(255), nullable=True),
        sa.Column('attachment_size', sa.String(50), nullable=True),
        sa.Column('contact_email', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_notices_published_date', 'notices', ['published_date'])

    # 9. notice_reads table
    op.create_table(
        'notice_reads',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('notice_id', sa.String(36), sa.ForeignKey('notices.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('notice_id', 'user_id', name='uq_notice_read_user'),
    )
    op.create_index('ix_notice_reads_notice_id', 'notice_reads', ['notice_id'])
    op.create_index('ix_notice_reads_user_id', 'notice_reads', ['user_id'])

    # 10. communities table
    op.create_table(
        'communities',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(150), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('short_description', sa.Text(), nullable=False),
        sa.Column('full_description', sa.Text(), nullable=False),
        sa.Column('avatar_initials', sa.String(10), nullable=False),
        sa.Column('cover_gradient', sa.String(255), nullable=True),
        sa.Column('meeting_schedule', sa.String(255), nullable=True),
        sa.Column('location', sa.String(255), nullable=True),
        sa.Column('lead_user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('lead_name', sa.String(150), nullable=True),
        sa.Column('lead_role', sa.String(100), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_communities_name', 'communities', ['name'], unique=True)

    # 11. community_memberships table
    op.create_table(
        'community_memberships',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('community_id', sa.String(36), sa.ForeignKey('communities.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='member'),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('community_id', 'user_id', name='uq_community_membership_user'),
    )
    op.create_index('ix_community_memberships_community_id', 'community_memberships', ['community_id'])
    op.create_index('ix_community_memberships_user_id', 'community_memberships', ['user_id'])

    # 12. notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('recipient_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('actor_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('target_url', sa.String(255), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_notifications_recipient_id', 'notifications', ['recipient_id'])
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'])
    op.create_index('ix_notifications_created_at', 'notifications', ['created_at'])


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('community_memberships')
    op.drop_table('communities')
    op.drop_table('notice_reads')
    op.drop_table('notices')
    op.drop_table('event_rsvps')
    op.drop_table('events')
    op.drop_table('post_likes')
    op.drop_table('comments')
    op.drop_table('posts')
    op.drop_table('student_profiles')
    op.drop_table('users')
