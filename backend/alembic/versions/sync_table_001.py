from alembic import op
import sqlalchemy as sa

revision = 'sync_table_001'
down_revision = '86ed63b963ae'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'user_sync_data',
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('data', sa.dialects.postgresql.JSONB, nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('user_sync_data')
