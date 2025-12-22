import { Container } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import AddCategoriaForm from '../components/AddCategoriaForm'

export default function Page() {
  return (
    <Container fluid>
      <PageBreadcrumb title="Agregar Categoría" subtitle="Ecommerce" />
      <AddCategoriaForm />
    </Container>
  )
}

